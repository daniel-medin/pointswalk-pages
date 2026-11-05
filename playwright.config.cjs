module.exports={
  testDir:'./tests/browser',
  use:{baseURL:'http://127.0.0.1:4173/pointswalk-pages/',channel:process.env.CI?undefined:'chrome',headless:true},
  webServer:{command:'node tests/serve.cjs',url:'http://127.0.0.1:4173/pointswalk-pages/',reuseExistingServer:false}
};
