const {test,expect}=require('@playwright/test');
const {PNG}=require('pngjs');
const jsQR=require('jsqr');
test('a printed QR opens on another device, scores survive reload, and exports merge once',async({page,browser})=>{
  await page.goto('./');await expect(page.locator('#statTotal')).toHaveText('3');
  await page.locator('#qText').fill('Hur mår Åsa?');await page.locator('#a1').fill('Bra');await page.locator('#ax').fill('Utmärkt');await page.locator('#a2').fill('Toppen');await page.locator('#qCorrect').selectOption('X');await page.locator('#btnAdd').click();
  await expect(page.locator('#statTotal')).toHaveText('4');
  const downloadEvent=page.waitForEvent('download');await page.locator('#btnDownloadQR').click();
  const download=await downloadEvent;const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);
  const png=PNG.sync.read(Buffer.concat(chunks));const decoded=jsQR(new Uint8ClampedArray(png.data),png.width,png.height);
  expect(decoded).not.toBeNull();expect(decoded.data).toContain('/pointswalk-pages/question.html?');
  const phone=await browser.newContext({viewport:{width:390,height:844}}),player=await phone.newPage();
  await player.goto(decoded.data);await expect(player.locator('#qTitle')).toHaveText('Hur mår Åsa?');
  await player.locator('#nameInput').fill('Åsa');await player.locator('#btnX').click();await player.locator('#btnSubmit').click();
  await expect(player.locator('#msg')).toContainText('Svar sparat');await player.reload();await expect(player.locator('#msg')).toContainText('redan svarat');
  await player.locator('#scoresLink').click();await expect(player.locator('#tbody tr')).toHaveCount(1);await expect(player.locator('#tbody tr')).toContainText('100%');
  const exportEvent=player.waitForEvent('download');await player.locator('#btnExportJson').click();const result=await exportEvent;const resultPath=await result.path();
  await page.goto('scoreboard.html');await page.locator('#resultsFile').setInputFiles(resultPath);await expect(page.locator('#status')).toContainText('Imported 1 new answers');await expect(page.locator('#tbody tr')).toContainText('Åsa');
  await page.locator('#resultsFile').setInputFiles(resultPath);await expect(page.locator('#status')).toContainText('Imported 0 new answers');await expect(page.locator('#tbody tr')).toHaveCount(1);
  await phone.close();
});
test('bad links fail clearly; imported text is rendered as text, and empty question lists persist',async({page})=>{
  await page.goto('question.html?id=missing');await expect(page.locator('#msg')).toContainText('hittades inte');await expect(page.locator('#btnSubmit')).toBeDisabled();
  await page.goto('./');page.on('dialog',d=>d.accept());
  const data=[{id:'q_safe',text:'<img src=x onerror=alert(1)>',a1:'1',ax:'X',a2:'2',correct:'1'}];
  await page.locator('#importFile').setInputFiles({name:'questions.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await expect(page.locator('#list h3')).toContainText('<img');await expect(page.locator('#list img')).toHaveCount(0);
  await page.locator('#btnWipe').click();await expect(page.locator('#statTotal')).toHaveText('0');await page.reload();await expect(page.locator('#statTotal')).toHaveText('0');
});
