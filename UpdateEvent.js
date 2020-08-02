var cheerio = require("cheerio");
var request = require("request");
var database = require("firebase").database();
var Util = require("./Utility");
var AddZero = Util.AddZero;
var Eventdata = {};
const predic_url = 'https://forum.gamer.com.tw/B.php?bsn=23772&subbsn=7';
const root = 'https://forum.gamer.com.tw/';
const event_url = "https://ponos.s3.dualstack.ap-northeast-1.amazonaws.com/information/appli/battlecats/event/tw/";

exports.UpdateEvent = function () {
  var t = new Date(),
      y = t.getFullYear(),
      m = t.getMonth()+1,
      d = t.getDate();

  database.ref("/event_date").once("value",(snapshot)=>{
    var temp = snapshot.val();
    for(let i in temp){
      Eventdata[i] = temp[i];
    }
    console.log("Module load event data complete!");

    var start,end;
    console.log("get event day ",y+AddZero(m)+AddZero(d));

    //update new event
    // CheckNewEvent(y,m,d);
    //update prediction
    request({
      url: predic_url,
      method: "GET"
    },function (e,r,b) {
      if(!e){
        $ = cheerio.load(b);
        let title = $(".b-list__row");
        let today = y+AddZero(m)+AddZero(d);
        let arr = [];
        title.each(function () {
          let a = $(this).children(".b-list__main").find("a");
          if(a.text().indexOf("活動資訊")!=-1){
            // console.log(a.text());
            let b = a.text().split("資訊")[1].split("(")[0].trim().split("~");
            for(let i in b){
              b[i] = b[i].split("/");
              for(let j in b[i]) b[i][j] = AddZero(b[i][j]);
              if(Number(b[i][0])>Number(m)+1) b[i] = (y-1)+b[i].join("");
              else if(Number(b[i][0])<Number(m)-10) b[i] = (y+1)+b[i].join("");
              else b[i] = (y)+b[i].join("");
              // b[i] = ((Number(b[i][0])>Number(m)+1?y-1:y)+b[i].join(""));
            }
            // console.log(b);
            if(b[1]>today){
              // console.log(a.text());
              start = b[0];end=b[1];
              // console.log(start,end);
              arr.push({url:root+a.attr("href"),start:start,end:end,name:a.text()});
            }
          }
        });
        // console.log(arr);
        for(i in arr){
          if (arr[i].url == Eventdata.prediction.source||
            arr[i].url == Eventdata.prediction_jp.source) continue
            console.log('update prediction');
            parsePrediction(arr[i],Eventdata);
          }
        }
      });

  });
}

exports.getData = function () {
  var t = new Date(),
      y = t.getFullYear(),
      m = t.getMonth()+1,
      d = t.getDate();
  if(Eventdata[(y+AddZero(m)+AddZero(d))]==undefined)  CheckNewEvent(y,m,d);
  return Eventdata
};


function CheckNewEvent(y,m,d) {
  if(Eventdata[(y+AddZero(m)+AddZero(d))]==undefined){
    request({
      url: event_url+y+AddZero(m)+AddZero(d)+".html",
      method: "GET"
    },function (e,r,b) {
      if(!e){
        $ = cheerio.load(b);
        var body = $("body").html(),
        cc = body.indexOf("<error>") == -1;
        console.log("event page load complete,update = ",cc);
        Eventdata[(y+AddZero(m)+AddZero(d))] = cc;
        database.ref("/event_date/"+(y+AddZero(m)+AddZero(d))).set(cc);
        if(cc){
          for(let i in Eventdata){
            if(i == 'prediction' || i == 'prediction_jp') continue;
            if(Number(i) < Number((y+AddZero(m)+AddZero(d)))-100) delete Eventdata[i];
          }
          Eventdata.text_event = simplifyTextEvent(b);
          database.ref("/event_date").set(Eventdata);
        }
      } else {console.log(e);}
    });
  }
}
function parsePrediction(obj,eventdate) {
  console.log(obj.name);
  let path = "/event_date/prediction";
  if(obj.name.indexOf('日版')!=-1){
    // console.log(/snA=[0-9]+/.exec(eventdate.prediction_jp.source)[0].split('=')[1]);
    if (Number(/snA=[0-9]+/.exec(eventdate.prediction_jp.source)[0].split('=')[1])>
        Number(/snA=[0-9]+/.exec(obj.url)[0].split('=')[1])) {console.log("don't update");return}
    path += '_jp';
  } else {
    if (Number(/snA=[0-9]+/.exec(eventdate.prediction.source)[0].split('=')[1])>
        Number(/snA=[0-9]+/.exec(obj.url)[0].split('=')[1])) {console.log("don't update");return}
  }
  request({
    url:obj.url,
    method:"GET"
  },function (e,r,b) {
    if(!e){
      $ = cheerio.load(b);
      var gachaP = $("section").eq(0).find(".c-article__content"),
          eventP = $("section").eq(1).find(".c-article__content");
      var gachaObj = [],eventObj = [],dateRe = /[0-9]+\/[0-9]+\~[0-9]+\/[0-9]+/ ;
      gachaP.find("div").each(function () {
        let content = $(this).text();
        if(content&&content.length<30){
          let arr = content.split(' ');
          let brr = arr[0].split("~");
          let cc = dateRe.test(arr[0]);
          if(cc&&arr[1]){
            gachaObj.push({
              date:brr,name:arr[1],
              sure:arr[arr.length-1].includes('必中')
            });
          }
        }
      });
      eventP.children("div").each(function () {
        let content = $(this).text();
        if( content.indexOf('課金')!=-1||
            content.indexOf('出售')!=-1||
            content.indexOf('來源')!=-1||!content) return
        arr = content.trim().split(' ');
        let brr = arr[0].split("~");
        let cc = dateRe.test(arr[0]);
        if(cc){
          eventObj.push({
            date:brr,
            name:arr[1]+(arr[2]?(" "+arr[2]):"")
          });
        }
      });
    }
    // console.log(gachaObj);
    // console.log(eventObj);
    database.ref(path).set({
      start:obj.start,
      end:obj.end,
      source:obj.url,
      eventP:eventObj,
      gachaP:gachaObj
    });
  });
}
function simplifyTextEvent(b) {
  $ = cheerio.load(b);
  var html = $("body"),object=[];

  html.children("article").each(function () {
    var title = $(this).find("h2"),
        block = $(this).find(".block").children("p");

    if(title.length == 0) return;
    if( title.text() == "活動日程"||
        title.text() == "貓咪大戰爭 官方YouTube"||
        title.text() == "貓咪大戰爭首款LINE貼圖上架！") return;
    block.remove(".fs76");
    object.push({title:title.text(),content:block.html()});
  });
  return object
}
