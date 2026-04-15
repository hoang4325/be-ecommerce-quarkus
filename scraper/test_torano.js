const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const res = await axios.get('https://torano.vn/collections/ao-thun-nam');
    const $ = cheerio.load(res.data);
    
    // Find products
    const products = [];
    $('.product-block').each((i, el) => {
      const name = $(el).find('.product-title').text().trim();
      let priceStr = $(el).find('.product-price').text().trim();
      const imageUrl = $(el).find('.product-img img').attr('data-src') || $(el).find('.product-img img').attr('src');
      
      products.push({ name, priceStr, imageUrl });
    });
    console.log("Products found:", products.slice(0, 5));
    
  } catch (err) {
    console.error(err.message);
  }
}
test();
