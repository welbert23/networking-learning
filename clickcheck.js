const puppeteer=require("puppeteer");
(async()=>{
 const b=await puppeteer.launch({headless:"new",args:["--no-sandbox"]});
 const p=await b.newPage();
 const errs=[];p.on("pageerror",e=>errs.push(e.message));
 await p.setViewport({width:1365,height:760});
 await p.goto("file:///C:/Users/Admin/OneDrive/Documents/Default%20Project/network-ebook/dist/Network-Lab.html",{waitUntil:"load"});
 const t=await p.evaluate(()=>[...document.querySelectorAll(".topbar a.iconbtn")].map(a=>({href:a.getAttribute("href"),label:a.textContent.trim(),svg:getComputedStyle(a.querySelector("svg")||a).width})));
 console.log("dist lab shortcuts:",JSON.stringify(t));
 await p.click(".topbar a[href='./Networking-Ebook.html']");
 await new Promise(r=>setTimeout(r,900));
 console.log("click Ebook ->",p.url().split("/").slice(-2).join("/"));
 console.log("errors:",errs.length?errs:"none");
 await b.close();
})();
