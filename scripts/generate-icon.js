const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 800 });

  await page.setContent(`
<!DOCTYPE html>
<html>
<head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body {
  width:512px; height:512px;
  display:flex; align-items:center; justify-content:center;
  background:transparent;
}
.icon {
  width:512px; height:512px;
  border-radius:96px;
  background:linear-gradient(135deg,#1e4d00 0%,#143800 100%);
  display:flex; align-items:center; justify-content:center;
  position:relative; overflow:hidden;
}
.wordmark {
  position:relative;
  display:flex;
  align-items:baseline;
  font-family:'Cormorant Garamond',serif;
  font-weight:700;
  line-height:1;
  margin-top:-20px;
}
.letter-m { color:#fff; font-size:148px; letter-spacing:-3px; }
.house-wrap {
  display:inline-flex; flex-direction:column;
  align-items:center; justify-content:flex-end;
  width:86px; height:148px;
  position:relative; margin:0 -2px;
}
.house {
  position:absolute; bottom:14px;
  width:80px; height:80px;
}
.roof {
  position:absolute; top:0; left:50%;
  transform:translateX(-50%);
  width:0; height:0;
  border-left:42px solid transparent;
  border-right:42px solid transparent;
  border-bottom:38px solid #fff;
}
.body {
  position:absolute; bottom:0; left:50%;
  transform:translateX(-50%);
  width:66px; height:46px;
  background:#fff; border-radius:2px;
}
.door {
  position:absolute; bottom:0; left:50%;
  transform:translateX(-50%);
  width:14px; height:22px;
  background:#1e4d00;
  border-radius:3px 3px 0 0;
}
.win-row {
  position:absolute; top:10px; width:100%;
  display:flex; justify-content:space-evenly;
}
.win { width:9px; height:9px; background:#1e4d00; border-radius:1px; }
.letter-id { color:#fff; font-size:148px; letter-spacing:-3px; }
.letter-it { color:#d6a13a; font-size:148px; font-style:italic; letter-spacing:-3px; margin-left:-4px; }
</style>
</head>
<body>
<div class="icon">
  <div class="wordmark">
    <span class="letter-m">m</span>
    <span class="house-wrap">
      <span class="house">
        <span class="roof"></span>
        <span class="body">
          <span class="win-row">
            <span class="win"></span>
            <span class="win"></span>
          </span>
          <span class="door"></span>
        </span>
      </span>
    </span>
    <span class="letter-id">id</span>
    <span class="letter-it">it</span>
  </div>
</div>
</body>
</html>
  `);

  // Wait for font to load
  await new Promise(r => setTimeout(r, 2000));

  // 512x512
  const el512 = await page.$('.icon');
  await el512.screenshot({
    path: 'public/icon-512.png',
    omitBackground: false
  });
  console.log('✓ icon-512.png saved');

  // 192x192 — scale down
  await page.evaluate(() => {
    document.querySelector('.icon').style.transform = 'scale(0.375)';
    document.querySelector('.icon').style.transformOrigin = 'top left';
  });
  await page.setViewport({ width: 192, height: 192 });
  const el192 = await page.$('.icon');
  await el192.screenshot({
    path: 'public/icon-192.png',
    omitBackground: false,
    clip: { x:0, y:0, width:192, height:192 }
  });
  console.log('✓ icon-192.png saved');

  await browser.close();
})();
