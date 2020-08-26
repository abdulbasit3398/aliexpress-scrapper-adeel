const express = require('express')
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const app = express()
const port = 80
const bodyParser = require('body-parser');
app.use(bodyParser.json({limit: '50mb'}));

app.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb'
}));

app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", '*');
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.setHeader("Access-Control-Allow-Headers", 'Authorization,Origin,X-Requested-With,Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.get('/', (req, res) => {
    res.send('working');
})

app.post('/',async (req,res) =>{
  const browser = await puppeteer.launch({headless: true,
   args: ['--no-sandbox']});
  const page = await browser.newPage();

  /** Scrape the aliexpress product page for details */
  await page.goto(`https://www.aliexpress.com/item/${req.body.product_id}.html`);
  const aliExpressData = await page.evaluate(() => runParams);
  const data = aliExpressData.data;

  /** Scrape the description page for the product using the description url */
  const descriptionUrl = data.descriptionModule.descriptionUrl;
  await page.goto(descriptionUrl);
  const descriptionPageHtml = await page.content();

  /** Build the AST for the description page html content using cheerio */
  const $ = cheerio.load(descriptionPageHtml);
  const descriptionData = $('body').html();

  /** Fetch the adminAccountId required to fetch the feedbacks */
  const adminAccountId = await page.evaluate(() => adminAccountId);
  await browser.close();


  /** Build the JSON response with aliexpress product details */
  const json = {
    title: data.titleModule.subject,
    categoryId: data.actionModule.categoryId,
    productId: data.actionModule.productId,
    totalAvailableQuantity: data.quantityModule.totalAvailQuantity,
    description: descriptionData,
    orders: data.titleModule.tradeCount,
    images:
      (data.imageModule &&
        data.imageModule.imagePathList) ||
      []
  };
  // console.log(json);
  res.json(json);
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})



