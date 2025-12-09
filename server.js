require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const port = process.env.PORT || 3012;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Serve static files (รูปสินค้า)
app.use('/upload', express.static(path.join(__dirname, 'uploads')));

// MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+07:00"
});

// Test MySQL connection
(async function testMySQL() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Connected to MySQL:', process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error('❌ MySQL Connection Failed:', err);
    process.exit(1);
  }
})();

// GET all products
app.get('/api/product', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY lastUpdate DESC');
    res.json(rows);
  } catch (e) {
    console.error('Products Error:', e);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST create product
app.post('/api/product', async (req, res) => {
  try {
    const { name, stock, category, location, image,imageUrl, status, price } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const parsedPrice = price ? parseFloat(price) : 0;
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Invalid price value' });
    }

    const [rs] = await pool.query(
      `INSERT INTO products
      (name, stock, category, location, image,imageUrl, status, price, lastUpdate)
      VALUES (?, ?, ?, ?, ?, ?, ?,?, NOW())`,
      [name, stock || 0, category || null, location || null, image || null, imageUrl || null,status || 'Active', parsedPrice]
    );

    console.log(`📦 Product created: ${name} (ID: ${rs.insertId})`);
    return res.status(201).json({ success: true, productId: rs.insertId });
  } catch (e) {
    console.error('Create Product Error:', e);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

// JWT Auth Middleware
function authToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    return res.status(500).json({ error: 'JWT_SECRET not set in .env' });
  }

  if (!token) return res.status(401).json({ error: 'Access Token Required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid Token' });
    req.user = user;
    next();
  });
}

// --------- Helper ลบไฟล์เก่า ---------
const deleteFileFromDisk = (filename) => {
  const imagePath = path.join('./upload/images/', filename);
  const documentPath = path.join('./upload/documents/', filename);

  [imagePath, documentPath].forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted file: ${filePath}`);
      } catch (error) {
        console.error(`Failed to delete file: ${filePath}`, error);
      }
    }
  });
};

app.put('/api/product/:id', async (req, res) => {
  console.log('Received body:', req.body);
  try {
    console.log('PUT /api/product/:id body:', req.body);
    console.log('params:', req.params);
    const { id } = req.params;
    const {
      name,
      price,
      stock,
      status,
      category,
      location,
      imageUrl,
      image,
      file_type,
      file_name,
      file_size
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const parsedPrice = price ? parseFloat(price) : 0;
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Invalid price value' });
    }

    // เช็คว่ามีสินค้านี้อยู่ไหม + เก็บของเดิมไว้เทียบลบไฟล์เก่า
    const [found] = await pool.query(
      'SELECT id, image, file_name FROM products WHERE id = ?',
      [id]
    );

    if (found.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const oldProduct = found[0];

    // ตรวจรูปเปลี่ยนแปลง และมีไฟล์เก่าบนดิสก์ให้ลบทิ้ง
    if (oldProduct.image && oldProduct.image !== image && oldProduct.file_name) {
      deleteFileFromDisk(oldProduct.file_name);
    }

    // UPDATE product
    await pool.query(
      `UPDATE products SET
        name = ?, price = ?, stock = ?, status = ?, category = ?, location = ?,
        image = ?, imageUrl = ?, file_type = ?, file_name = ?, file_size = ?, lastUpdate = NOW()
      WHERE id = ?`,
      [
        name,
        parsedPrice,
        stock || 0,
        status || 'Active',
        category || null,
        location || null,
        image || null,
        imageUrl || null,
        file_type || null,
        file_name || null,
        file_size || null,
        id
      ]
    );

    console.log(`✅ Product updated: ${name} (ID: ${id})`);
    return res.json({ success: true, productId: id });
  } catch (error) {
    console.error('Update Product Error:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/product/:id', async (req, res) => {
  console.log('Delete request for id:', req.params.id);

  try {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Get product info for file cleanup
    const [found] = await pool.query(
      'SELECT id, file_name FROM products WHERE id = ?',
      [parseInt(id)] // Convert to integer
    );

    if (found.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = found[0];

    // Delete from database first
    console.log('Attempting to delete product with id:', id);
    const [deleteResult] = await pool.query('DELETE FROM products WHERE id = ?', [parseInt(id)]);

    // Check if deletion was successful
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found or already deleted' });
    }

    // Clean up associated file (do this after successful DB deletion)
    if (product.file_name) {
      try {
        deleteFileFromDisk(product.file_name);
      } catch (fileError) {
        console.error('File deletion error (non-critical):', fileError);
        // Don't fail the request if file deletion fails
      }
    }

    console.log(` Product deleted successfully: ID ${id}`);
    return res.json({
      success: true,
      productId: parseInt(id),
      message: 'Product deleted successfully'
    });

  } catch (e) {
    console.error('Delete Product Error:', {
      message: e.message,
      stack: e.stack,
      params: req.params,
      time: new Date().toISOString(),
    });
    return res.status(500).json({ error: 'Failed to delete product', details: e.message });
  }
});

app.post('/api/product/delete', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete' });
  }
});
// Health check
app.get('/api', (req, res) => {
  res.send('API IS RUNNING!!!!!!!');
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 API running on port ${port}`);
});
