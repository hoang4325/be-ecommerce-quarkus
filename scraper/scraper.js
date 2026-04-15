const puppeteer = require('puppeteer');
const axios = require('axios');

// Configure our local API endpoint
const API_URL = 'http://localhost:8086/api';

const autoSlug = (name) => {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

const formatPrice = (priceText) => {
  const numericStr = priceText.replace(/[^0-9]/g, '');
  return parseInt(numericStr) || 250000;
};

async function scrapeAndSeed() {
  try {
    const authRes = await axios.post(`http://localhost:8082/api/auth/login`, {
      email: 'admin@ecommerce.com',
      password: 'admin123'
    });
    const token = authRes.data.data.access_token;
    if (!token) throw new Error("No token returned");
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('✅ Đăng nhập thành công!');
  } catch (err) {
    console.error('❌ Đăng nhập thất bại. Kiểm tra xem backend đã chạy chưa:', err.message);
    return;
  }

  console.log('Khởi động trình duyệt cào dữ liệu...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Disable loading images/fonts to speed up scraping
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.resourceType() === 'image' || req.resourceType() === 'stylesheet' || req.resourceType() === 'font') {
      req.abort();
    } else {
      req.continue();
    }
  });

  try {
    // We will hardcode a few known category URLs to Torano to ensure we get data
    // Torano has clean structures like /collections/ao-thun-nam
    const targets = [
      { name: 'Áo Polo Nam', url: 'https://torano.vn/collections/ao-polo-nam' },
      { name: 'Áo Sơ Mi Nam', url: 'https://torano.vn/collections/ao-so-mi-nam' },
      { name: 'Áo Thun Nam', url: 'https://torano.vn/collections/ao-thun-nam' },
      { name: 'Quần Shorts Nam', url: 'https://torano.vn/collections/quan-short-nam' },
      { name: 'Quần Kaki Nam', url: 'https://torano.vn/collections/quan-kaki-nam' }
    ];

    for (const target of targets) {
      console.log(`\n===========================================`);
      console.log(`Đang xử lý danh mục: ${target.name}`);
      
      // 1. Create Category in our DB
      let categoryId = null;
      try {
        const catRes = await axios.post(`${API_URL}/categories`, {
          name: target.name,
          slug: autoSlug(target.name)
        });
        categoryId = catRes.data.data.id;
        console.log(`Đã tạo Category trong DB với ID: ${categoryId}`);
      } catch (err) {
        console.error(`❌ Lỗi tạo danh mục ${target.name}:`, err.response?.data?.message || err.message);
        // Ignore if exists, or skip. To be safe, if we get 400 because name exists, we could fetch categories.
        // Let's fetch all categories to find the ID if it failed.
        const allCats = await axios.get(`${API_URL}/categories`);
        const existing = allCats.data.data.find(c => c.name === target.name);
        if (existing) {
          categoryId = existing.id;
          console.log(`Danh mục đã tồn tại, dùng ID: ${categoryId}`);
        } else {
          continue;
        }
      }

      // 2. Scrape Torano page
      console.log(`Đang tải trang web: ${target.url}`);
      await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      const products = await page.evaluate(() => {
        const items = [];
        // Find elements that look like a price (contains ₫ or d or đ)
        const allNodes = Array.from(document.querySelectorAll('*'));
        const priceNodes = allNodes.filter(n => 
          n.children.length === 0 && 
          n.textContent.match(/[0-9,\.]+\s*(₫|đ|d|vnđ)/i)
        );

        priceNodes.forEach(priceNode => {
          let container = null;
          let curr = priceNode;
          for(let i=0; i<6; i++) {
            if (curr.parentElement) {
              curr = curr.parentElement;
              if (curr.querySelector('img') && (curr.querySelector('h3') || curr.querySelector('h2') || curr.querySelector('a'))) {
                container = curr;
              }
            }
          }

          if (container) {
            // find title
            let titleStr = '';
            const h3 = container.querySelector('h3, h2');
            if (h3) titleStr = h3.innerText.trim();
            else {
              const a = container.querySelector('a[title]');
              if (a) titleStr = a.getAttribute('title');
            }
            
            const imgEl = container.querySelector('img');
            const img = imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || imgEl.getAttribute('data-lazyload')) : '';
            
            const priceStr = priceNode.textContent.trim();
            
            if (titleStr && titleStr.length > 3 && img && !items.find(i => i.name === titleStr)) {
              items.push({ name: titleStr, price: priceStr, image: img });
            }
          }
        });
        return items;
      });

      console.log(`Đã tìm thấy ${products.length} sản phẩm trên Torano. Bắt đầu đẩy vào DB...`);

      // 3. Post to our DB
      let successCount = 0;
      for (const p of products.slice(0, 10)) { // limit to 10 per category so we don't bombard the DB immediately
        try {
          let imageUrl = p.image;
          if (imageUrl && imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;

          await axios.post(`${API_URL}/products`, {
            name: p.name,
            slug: autoSlug(p.name) + '-' + Math.floor(Math.random()*1000), // ensure uniqueness
            price: formatPrice(p.price) || 300000,
            categoryId: categoryId,
            imageUrl: imageUrl,
            description: `Sản phẩm ${p.name} chuẩn phong cách. Nhập nguyên bản từ Torano.`
          });
          successCount++;
        } catch (err) {
          console.error(`❌ Lỗi thêm SP ${p.name}:`, err.response?.data?.message || err.message);
        }
      }
      console.log(`✅ Đã thêm thành công ${successCount} sản phẩm.`);
    }

  } catch (error) {
    console.error('Lỗi tổng quan:', error);
  } finally {
    await browser.close();
    console.log('\nHoàn tất!');
  }
}

scrapeAndSeed();
