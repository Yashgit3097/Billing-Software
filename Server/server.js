const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://yashgithub907:Y%40sh%403097@billingsoftware.r0kvacd.mongodb.net/', {
  dbName: 'billing-db' // ← Replace with your actual database name
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));



// Models
const User = mongoose.model('User', {
  shopNameEnglish: String,
  mobileNumber: String,
  password: String
});

const Product = mongoose.model('Product', {
  userId: mongoose.Schema.Types.ObjectId,
  nameEnglish: String,
  price: Number,
  quantity: Number
});

const Bill = mongoose.model('Bill', {
  userId: mongoose.Schema.Types.ObjectId,
  customerName: String,
  customerMobile: String,
  date: { type: Date, default: Date.now },
  total: Number,
  items: [{
    productId: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    quantity: Number,
    total: Number
  }]
});

// Middleware
const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send('Access denied');

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = await User.findById(decoded._id);
    next();
  } catch (err) {
    res.status(400).send('Invalid token');
  }
};

// Registration
app.post('/api/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 8);

    const user = new User({
      shopNameEnglish: req.body.shopNameEnglish,
      mobileNumber: req.body.mobileNumber,
      password: hashedPassword
    });

    await user.save();

    const token = jwt.sign({ _id: user._id }, 'your_jwt_secret', { expiresIn: '10y' });
    res.status(201).send({ user, token });
  } catch (err) {
    res.status(400).send(err);
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const user = await User.findOne({ mobileNumber: req.body.mobileNumber });
    if (!user) return res.status(404).send('User not found');

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(401).send('Invalid credentials');

    const token = jwt.sign({ _id: user._id }, 'your_jwt_secret', { expiresIn: '10y' });
    res.send({ user, token });
  } catch (err) {
    res.status(400).send(err);
  }
});


/// Get all products
app.get('/api/products', authenticate, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user._id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create product
app.post('/api/products', authenticate, async (req, res) => {
  try {
    const { nameEnglish, price, quantity } = req.body;
    
    if (!nameEnglish || !price || !quantity) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const product = new Product({
      nameEnglish,
      price,
      quantity,
      userId: req.user._id
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update product
app.put('/api/products/:id', authenticate, async (req, res) => {
  try {
    console.log('USER:', req.user);
    console.log('BODY:', req.body);
    console.log('PARAMS:', req.params);

    const { nameEnglish, price, quantity } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { nameEnglish, price, quantity },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Delete product
app.delete('/api/products/:id', authenticate, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
// Delete Bill API
app.delete('/api/bills/:id', authenticate, async (req, res) => {
  try {
    const bill = await Bill.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });
    
    if (!bill) {
      return res.status(404).send('Bill not found');
    }
    
    res.send({ message: 'Bill deleted successfully' });
  } catch (err) {
    res.status(500).send(err);
  }
});
app.get('/api/bills', authenticate, async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user._id });
    res.send(bills);
  } catch (err) {
    res.status(500).send();
  }
});
// Bill Routes
// app.post('/api/bills', authenticate, async (req, res) => {
//   try {
//     const items = req.body.items.map(item => ({
//       productId: item.productId,
//       name: item.name,
//       price: item.price,
//       quantity: item.quantity,
//       total: item.price * item.quantity
//     }));

//     const total = items.reduce((sum, item) => sum + item.total, 0);

//     const bill = new Bill({
//       userId: req.user._id,
//       customerName: req.body.customerName,
//       customerMobile: req.body.customerMobile,
//       total,
//       items
//     });

//     await bill.save();

//     // Generate PDF
//     const doc = new PDFDocument({ margin: 30 });
//     let pdfBuffer = [];
//     doc.on('data', chunk => pdfBuffer.push(chunk));
//     doc.on('end', () => {
//       const pdfData = Buffer.concat(pdfBuffer);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=invoice_${bill._id}.pdf`);
//       res.send(pdfData);
//     });

//     // Helper function to draw colored header
//     const drawHeader = () => {
//       // Blue header background
//       doc.rect(0, 0, doc.page.width, 70)
//          .fillAndStroke('#2E86AB', '#2E86AB');
      
//       // Light blue accent
//       doc.rect(0, 50, doc.page.width, 20)
//          .fillAndStroke('#A23B72', '#A23B72');
//     };

//     // Draw header
//     drawHeader();

//     // Reset fill color for main content
//     doc.fillColor('black');

//     // Company Name (left side in header)
//     doc.fontSize(20)
//        .fillColor('white')
//        .text(req.user.shopNameEnglish, 40, 20, { align: 'left' });

//     // Invoice Title (right side in header)
//     doc.fontSize(18)
//        .fillColor('white')
//        .text('INVOICE', doc.page.width - 120, 20, { align: 'left' });

//     // Invoice Number and Date (right side, proper spacing)
//     doc.fillColor('black')
//        .fontSize(10)
//        .text(`Invoice No: ${bill._id.toString().slice(-8)}`, doc.page.width - 200, 90, { width: 150 })
//        .text(`Invoice Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN')}`, doc.page.width - 200, 110, { width: 150 });

//     // Customer Details (left side)
//     doc.fontSize(10)
//        .text('Name:', 40, 90)
//        .fontSize(12)
//        .text(req.body.customerName, 40, 105)
//        .fontSize(10)
//        .text('Phone:', 40, 125)
//        .fontSize(12)
//        .text(req.body.customerMobile || 'Not provided', 40, 140);

//     // Table Header
//     const tableTop = 180;
//     const tableHeaders = [
//       { text: 'S.No.', x: 40, width: 60 },
//       { text: 'Product Name', x: 100, width: 250 },
//       { text: 'Qty.', x: 370, width: 60 },
//       { text: 'Amount', x: 450, width: 100 }
//     ];

//     // Draw table header background
//     doc.rect(40, tableTop - 8, doc.page.width - 80, 25)
//        .fillAndStroke('#f5f5f5', '#ddd');

//     // Draw table headers
//     doc.fillColor('black')
//        .fontSize(12)
//        .font('Helvetica-Bold');
    
//     tableHeaders.forEach(header => {
//       doc.text(header.text, header.x, tableTop, { width: header.width, align: 'center' });
//     });

//     // Draw horizontal line after header
//     doc.moveTo(40, tableTop + 17)
//        .lineTo(doc.page.width - 40, tableTop + 17)
//        .stroke('#ddd');

//     // Draw table content
//     doc.font('Helvetica');
//     let currentY = tableTop + 30;
    
//     items.forEach((item, index) => {
//       // Alternate row colors for better readability
//       if (index % 2 === 0) {
//         doc.rect(40, currentY - 8, doc.page.width - 80, 25)
//            .fillAndStroke('#fafafa', '#fafafa');
//       }
      
//       doc.fillColor('black')
//          .fontSize(11)
//          .text((index + 1).toString(), 40, currentY, { width: 60, align: 'center' })
//          .text(item.name, 100, currentY, { width: 250, align: 'left' })
//          .text(item.quantity.toString(), 370, currentY, { width: 60, align: 'center' })
//          .text(`₹${item.total.toFixed(2)}`, 450, currentY, { width: 100, align: 'right' });
      
//       currentY += 25;
//     });

//     // Draw line above total
//     doc.moveTo(350, currentY + 10)
//        .lineTo(doc.page.width - 40, currentY + 10)
//        .stroke('#333');

//     // Total amount with better styling
//     doc.fontSize(14)
//        .font('Helvetica-Bold')
//        .fillColor('#2E86AB')
//        .text('Total:', 400, currentY + 25, { width: 50, align: 'right' })
//        .text(`₹${total.toFixed(2)}`, 450, currentY + 25, { width: 100, align: 'right' });

//     // Thank you message
//     doc.fontSize(12)
//        .fillColor('black')
//        .font('Helvetica')
//        .text('Thank you for your business!', 40, currentY + 80, { align: 'center', width: doc.page.width - 80 });

//     doc.end();
//   } catch (err) {
//     res.status(400).send(err);
//   }
// });
app.get('/api/bills/export/excel', authenticate, async (req, res) => {
  try {
    const bills = await Bill.find({ userId: req.user._id });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bills');

    worksheet.columns = [
      { header: 'Sr No', key: 'sr', width: 10 },
      { header: 'Bill ID', key: 'id', width: 24 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Customer Name', key: 'name', width: 20 },
      { header: 'Total (₹)', key: 'total', width: 15 },
    ];

    // Center alignment for header
    worksheet.getRow(1).eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { bold: true };
    });

    bills.forEach((bill, index) => {
      worksheet.addRow({
        sr: index + 1,
        id: bill._id.toString(),
        date: new Date(bill.date).toLocaleDateString('en-GB'),
        name: bill.customerName,
        total: bill.total.toFixed(2),
      });
    });

    // Center all cells
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=bills.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).send('Server error');
  }
});
// Create new bill route
app.post('/api/bills', authenticate, async (req, res) => {
  try {
    const items = req.body.items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity
    }));

    const total = items.reduce((sum, item) => sum + item.total, 0);

    const bill = new Bill({
      userId: req.user._id,
      customerName: req.body.customerName,
      customerMobile: req.body.customerMobile,
      total,
      items,
      createdAt: new Date() // Explicitly set creation date
    });

    await bill.save();

    // Generate PDF
    const doc = new PDFDocument({ margin: 30 });
    let pdfBuffer = [];
    doc.on('data', chunk => pdfBuffer.push(chunk));
    doc.on('end', () => {
      const pdfData = Buffer.concat(pdfBuffer);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${bill._id}.pdf`);
      res.send(pdfData);
    });

    // Helper function to draw colored header
    const drawHeader = () => {
      // Blue header background
      doc.rect(0, 0, doc.page.width, 70)
         .fillAndStroke('#2E86AB', '#2E86AB');
      
      // Light blue accent
      doc.rect(0, 50, doc.page.width, 20)
         .fillAndStroke('#A23B72', '#A23B72');
    };

    // Draw header
    drawHeader();

    // Reset fill color for main content
    doc.fillColor('black');

    // Company Name (left side in header)
    doc.fontSize(20)
       .fillColor('white')
       .text(req.user.shopNameEnglish || 'My Shop', 40, 20, { align: 'left' });

    // Invoice Title (right side in header)
    doc.fontSize(18)
       .fillColor('white')
       .text('INVOICE', doc.page.width - 120, 20, { align: 'left' });

    // Invoice Number and Date (right side, proper spacing)
    doc.fillColor('black')
       .fontSize(10)
       .text(`Invoice No: ${bill._id.toString().slice(-8)}`, doc.page.width - 200, 90, { width: 150, align: 'left' })
       .text(`Invoice Date: ${new Date(bill.date).toLocaleDateString('en-GB')
}`, doc.page.width - 200, 110, { width: 150, align: 'left' });

    // Customer Details (left side)
    doc.fontSize(10)
       .text('Name:', 40, 90, { align: 'left' })
       .fontSize(12)
       .text(bill.customerName || 'Walk-in Customer', 40, 105, { align: 'left' })
       .fontSize(10)
       .text('Phone:', 40, 125, { align: 'left' })
       .fontSize(12)
       .text(bill.customerMobile || 'Not provided', 40, 140, { align: 'left' });

    // Table Header
    const tableTop = 180;
    const columnPositions = {
      serial: 40,
      name: 100,
      qty: 350,
      amount: 450
    };
    const columnWidths = {
      serial: 60,
      name: 250,
      qty: 100,
      amount: 100
    };

    // Draw table header background
    doc.rect(40, tableTop - 8, doc.page.width - 80, 25)
       .fillAndStroke('#f5f5f5', '#ddd');

    // Draw table headers
    doc.fillColor('black')
       .fontSize(12)
       .font('Helvetica-Bold');
    
    // Centered headers
    doc.text('S.No.', columnPositions.serial, tableTop, { width: columnWidths.serial, align: 'center' })
       .text('Product Name', columnPositions.name, tableTop, { width: columnWidths.name, align: 'center' })
       .text('Qty.', columnPositions.qty, tableTop, { width: columnWidths.qty, align: 'center' })
       .text('Amount', columnPositions.amount, tableTop, { width: columnWidths.amount, align: 'center' });

    // Draw horizontal line after header
    doc.moveTo(40, tableTop + 17)
       .lineTo(doc.page.width - 40, tableTop + 17)
       .stroke('#ddd');

    // Draw table content
    doc.font('Helvetica');
    let currentY = tableTop + 30;
    
    items.forEach((item, index) => {
      // Alternate row colors for better readability
      if (index % 2 === 0) {
        doc.rect(40, currentY - 8, doc.page.width - 80, 25)
           .fillAndStroke('#fafafa', '#fafafa');
      }
      
      // Centered content
      doc.fillColor('black')
         .fontSize(11)
         .text((index + 1).toString(), columnPositions.serial, currentY, { width: columnWidths.serial, align: 'center' })
         .text(item.name, columnPositions.name, currentY, { width: columnWidths.name, align: 'center' })
         .text(item.quantity.toString(), columnPositions.qty, currentY, { width: columnWidths.qty, align: 'center' })
         .text(`₹${item.total.toFixed(2)}`, columnPositions.amount, currentY, { width: columnWidths.amount, align: 'center' });
      
      currentY += 25;
    });

    // Draw line above total
    doc.moveTo(350, currentY + 10)
       .lineTo(doc.page.width - 40, currentY + 10)
       .stroke('#333');

    // Total amount with better styling
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2E86AB')
       .text('Total:', columnPositions.qty, currentY + 25, { width: columnWidths.qty, align: 'right' })
       .text(`₹${total.toFixed(2)}`, columnPositions.amount, currentY + 25, { width: columnWidths.amount, align: 'center' });

    // Thank you message
    doc.fontSize(12)
       .fillColor('black')
       .font('Helvetica')
       .text('Thank you for your business!', 40, currentY + 80, { align: 'center', width: doc.page.width - 80 });

    doc.end();
  } catch (err) {
    console.error('Error creating bill:', err);
    res.status(400).json({ error: err.message });
  }
});

// Download existing bill route
app.get('/api/bills/:id/download', authenticate, async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, userId: req.user._id });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });

    const user = await User.findById(req.user._id);

    // Generate PDF
    const doc = new PDFDocument({ margin: 30 });
    let pdfBuffer = [];
    doc.on('data', chunk => pdfBuffer.push(chunk));
    doc.on('end', () => {
      const pdfData = Buffer.concat(pdfBuffer);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice_${bill._id}.pdf`);
      res.send(pdfData);
    });

    // Helper function to draw colored header
    const drawHeader = () => {
      // Blue header background
      doc.rect(0, 0, doc.page.width, 70)
         .fillAndStroke('#2E86AB', '#2E86AB');
      
      // Light blue accent
      doc.rect(0, 50, doc.page.width, 20)
         .fillAndStroke('#A23B72', '#A23B72');
    };

    // Draw header
    drawHeader();

    // Reset fill color for main content
    doc.fillColor('black');

    // Company Name (left side in header)
    doc.fontSize(20)
       .fillColor('white')
       .text(user.shopNameEnglish || 'My Shop', 40, 20, { align: 'left' });

    // Invoice Title (right side in header)
    doc.fontSize(18)
       .fillColor('white')
       .text('INVOICE', doc.page.width - 120, 20, { align: 'left' });

    // Invoice Number and Date (right side, proper spacing)
    doc.fillColor('black')
       .fontSize(10)
       .text(`Invoice No: ${bill._id.toString().slice(-8)}`, doc.page.width - 200, 90, { width: 150, align: 'left' })
       .text(`Invoice Date: ${new Date(bill.date).toLocaleDateString('en-GB')
}`, doc.page.width - 200, 110, { width: 150, align: 'left' });
//new Date(bill.date).toLocaleDateString()
    // Customer Details (left side)
    doc.fontSize(10)
       .text('Name:', 40, 90, { align: 'left' })
       .fontSize(12)
       .text(bill.customerName || 'Walk-in Customer', 40, 105, { align: 'left' })
       .fontSize(10)
       .text('Phone:', 40, 125, { align: 'left' })
       .fontSize(12)
       .text(bill.customerMobile || 'Not provided', 40, 140, { align: 'left' });

    // Table Header
    const tableTop = 180;
    const columnPositions = {
      serial: 40,
      name: 100,
      qty: 350,
      amount: 450
    };
    const columnWidths = {
      serial: 60,
      name: 250,
      qty: 100,
      amount: 100
    };

    // Draw table header background
    doc.rect(40, tableTop - 8, doc.page.width - 80, 25)
       .fillAndStroke('#f5f5f5', '#ddd');

    // Draw table headers
    doc.fillColor('black')
       .fontSize(12)
       .font('Helvetica-Bold');
    
    // Centered headers
    doc.text('S.No.', columnPositions.serial, tableTop, { width: columnWidths.serial, align: 'center' })
       .text('Product Name', columnPositions.name, tableTop, { width: columnWidths.name, align: 'center' })
       .text('Qty.', columnPositions.qty, tableTop, { width: columnWidths.qty, align: 'center' })
       .text('Amount', columnPositions.amount, tableTop, { width: columnWidths.amount, align: 'center' });

    // Draw horizontal line after header
    doc.moveTo(40, tableTop + 17)
       .lineTo(doc.page.width - 40, tableTop + 17)
       .stroke('#ddd');

    // Draw table content
    doc.font('Helvetica');
    let currentY = tableTop + 30;
    
    bill.items.forEach((item, index) => {
      // Alternate row colors for better readability
      if (index % 2 === 0) {
        doc.rect(40, currentY - 8, doc.page.width - 80, 25)
           .fillAndStroke('#fafafa', '#fafafa');
      }
      
      // Centered content
      doc.fillColor('black')
         .fontSize(11)
         .text((index + 1).toString(), columnPositions.serial, currentY, { width: columnWidths.serial, align: 'center' })
         .text(item.name, columnPositions.name, currentY, { width: columnWidths.name, align: 'center' })
         .text(item.quantity.toString(), columnPositions.qty, currentY, { width: columnWidths.qty, align: 'center' })
         .text(`₹${item.total.toFixed(2)}`, columnPositions.amount, currentY, { width: columnWidths.amount, align: 'center' });
      
      currentY += 25;
    });

    // Draw line above total
    doc.moveTo(350, currentY + 10)
       .lineTo(doc.page.width - 40, currentY + 10)
       .stroke('#333');

    // Total amount with better styling
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor('#2E86AB')
       .text('Total:', columnPositions.qty, currentY + 25, { width: columnWidths.qty, align: 'right' })
       .text(`₹${bill.total.toFixed(2)}`, columnPositions.amount, currentY + 25, { width: columnWidths.amount, align: 'center' });

    // Thank you message
    doc.fontSize(12)
       .fillColor('black')
       .font('Helvetica')
       .text('Thank you for your business!', 40, currentY + 80, { align: 'center', width: doc.page.width - 80 });

    doc.end();
  } catch (err) {
    console.error('Error downloading bill:', err);
    res.status(400).json({ error: err.message });
  }
});
// // Download existing bill route
// app.get('/api/bills/:id/download', authenticate, async (req, res) => {
//   try {
//     const bill = await Bill.findOne({ _id: req.params.id, userId: req.user._id });
//     if (!bill) return res.status(404).send('Bill not found');

//     const user = await User.findById(req.user._id);

//     // Generate PDF
//     const doc = new PDFDocument({ margin: 30 });
//     let pdfBuffer = [];
//     doc.on('data', chunk => pdfBuffer.push(chunk));
//     doc.on('end', () => {
//       const pdfData = Buffer.concat(pdfBuffer);
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=invoice_${bill._id}.pdf`);
//       res.send(pdfData);
//     });

//     // Helper function to draw colored header
//     const drawHeader = () => {
//       // Blue header background
//       doc.rect(0, 0, doc.page.width, 70)
//          .fillAndStroke('#2E86AB', '#2E86AB');
      
//       // Light blue accent
//       doc.rect(0, 50, doc.page.width, 20)
//          .fillAndStroke('#A23B72', '#A23B72');
//     };

//     // Draw header
//     drawHeader();

//     // Reset fill color for main content
//     doc.fillColor('black');

//     // Company Name (left side in header)
//     doc.fontSize(20)
//        .fillColor('white')
//        .text(user.shopNameEnglish, 40, 20, { align: 'left' });

//     // Invoice Title (right side in header)
//     doc.fontSize(18)
//        .fillColor('white')
//        .text('INVOICE', doc.page.width - 120, 20, { align: 'left' });

//     // Invoice Number and Date (right side, proper spacing)
//     doc.fillColor('black')
//        .fontSize(10)
//        .text(`Invoice No: ${bill._id.toString().slice(-8)}`, doc.page.width - 200, 90, { width: 150 })
//        .text(`Invoice Date: ${new Date(bill.createdAt).toLocaleDateString('en-IN')}`, doc.page.width - 200, 110, { width: 150 });

//     // Customer Details (left side)
//     doc.fontSize(10)
//        .text('Name:', 40, 90)
//        .fontSize(12)
//        .text(bill.customerName, 40, 105)
//        .fontSize(10)
//        .text('Phone:', 40, 125)
//        .fontSize(12)
//        .text(bill.customerMobile || 'Not provided', 40, 140);

//     // Table Header
//     const tableTop = 180;
//     const tableHeaders = [
//       { text: 'S.No.', x: 40, width: 60 },
//       { text: 'Product Name', x: 100, width: 250 },
//       { text: 'Qty.', x: 370, width: 60 },
//       { text: 'Amount', x: 450, width: 100 }
//     ];

//     // Draw table header background
//     doc.rect(40, tableTop - 8, doc.page.width - 80, 25)
//        .fillAndStroke('#f5f5f5', '#ddd');

//     // Draw table headers
//     doc.fillColor('black')
//        .fontSize(12)
//        .font('Helvetica-Bold');
    
//     tableHeaders.forEach(header => {
//       doc.text(header.text, header.x, tableTop, { width: header.width, align: 'center' });
//     });

//     // Draw horizontal line after header
//     doc.moveTo(40, tableTop + 17)
//        .lineTo(doc.page.width - 40, tableTop + 17)
//        .stroke('#ddd');

//     // Draw table content
//     doc.font('Helvetica');
//     let currentY = tableTop + 30;
    
//     bill.items.forEach((item, index) => {
//       // Alternate row colors for better readability
//       if (index % 2 === 0) {
//         doc.rect(40, currentY - 8, doc.page.width - 80, 25)
//            .fillAndStroke('#fafafa', '#fafafa');
//       }
      
//       doc.fillColor('black')
//          .fontSize(11)
//          .text((index + 1).toString(), 40, currentY, { width: 60, align: 'center' })
//          .text(item.name, 100, currentY, { width: 250, align: 'left' })
//          .text(item.quantity.toString(), 370, currentY, { width: 60, align: 'center' })
//          .text(`₹${item.total.toFixed(2)}`, 450, currentY, { width: 100, align: 'right' });
      
//       currentY += 25;
//     });

//     // Draw line above total
//     doc.moveTo(350, currentY + 10)
//        .lineTo(doc.page.width - 40, currentY + 10)
//        .stroke('#333');

//     // Total amount with better styling
//     doc.fontSize(14)
//        .font('Helvetica-Bold')
//        .fillColor('#2E86AB')
//        .text('Total:', 400, currentY + 25, { width: 50, align: 'right' })
//        .text(`₹${bill.total.toFixed(2)}`, 450, currentY + 25, { width: 100, align: 'right' });

//     // Thank you message
//     doc.fontSize(12)
//        .fillColor('black')
//        .font('Helvetica')
//        .text('Thank you for your business!', 40, currentY + 80, { align: 'center', width: doc.page.width - 80 });

//     doc.end();
//   } catch (err) {
//     res.status(400).send(err);
//   }
// });
// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));