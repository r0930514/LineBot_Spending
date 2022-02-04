var CHANNEL_ACCESS_TOKEN = '';
var momUserid = ''

function doPost(e) {
  //line訊息
  var msg = JSON.parse(e.postData.contents);

  //設定試算表（Sheet）設定
  var SpreadSheet = SpreadsheetApp.openById("");
  var Sheet = SpreadSheet.getSheetByName("工作表1");

  // 取出 replayToken 和發送的訊息文字
  var replyToken = msg.events[0].replyToken;
  var userMessage = msg.events[0].message.text;
  var userId = msg.events[0].source.userId;
  var msgtype = msg.events[0].message.type;
  var Row = Sheet.getSheetValues(2,6,1,1); //取得要加入第幾行


  if (typeof replyToken === 'undefined' || msgtype != "text") {
    return;
  }

  switch(userMessage){
    //如果收到"切換！"就執行開關通知
    case "切換！":
      var Switch = Sheet.getSheetValues(2,5,1,1); //要不要傳給大小姐
      if(Switch == 1){
        Sheet.getRange(2, 5).setValue(0);
        replymsg("關閉通知", replyToken);
      }
      if(Switch == 0){
        Sheet.getRange(2, 5).setValue(1);
        replymsg("開啟通知", replyToken);
      }
      return;

    case "結算！":
      if (userId == momUserid) {
      replymsg("你不可以按！", replyToken);
      return;
      }
      var Sum = Sheet.getSheetValues(2,4,1,1); //取得已累積多少錢
      var rmsg = "";
      var Row = Sheet.getSheetValues(2,6,1,1) - 1;
      for(var i = 2; i <= Row; i++){
        rmsg = rmsg + Sheet.getSheetValues(i, 1, 1, 1) + Sheet.getSheetValues(i,2,1,1)+ "\n";
        Sheet.getRange(i, 1).setValue("");
        Sheet.getRange(i, 2).setValue("");
        }
      rmsg = rmsg + "已累積" + Sum + "元" + "\n已清除所有資料";
      replymsg(rmsg, replyToken);
      if(Sheet.getSheetValues(2,5,1,1) == 1 && userId != momUserid){
        SendMsgToMom(rmsg);
      }
      return;

    case "明細！":
      var Sum = Sheet.getSheetValues(2,4,1,1); //取得已累積多少錢
      var rmsg = "";
      var Row = Sheet.getSheetValues(2,6,1,1) - 1;
      for(var i = 2; i <= Row; i++){
        rmsg = rmsg + Sheet.getSheetValues(i, 1, 1, 1) + Sheet.getSheetValues(i,2,1,1)+ "\n";
        }
      rmsg = rmsg + "已累積" + Sheet.getSheetValues(2,4,1,1) + "元\n";
      rmsg+= "通知開關："+ Sheet.getSheetValues(2,5,1,1); 
      replymsg(rmsg, replyToken);
      return;
    
    case "刪除":
      if(Row<=2 || Row>62 ){
        replymsg("無法操作",replyToken);
        return;
      }
      if(userId == momUserid){
        replymsg("你不可以按！",replyToken);
        return;
      }
      var tempmsg = "已刪除以下項目：\n";
      tempmsg+= Sheet.getSheetValues(Row-1, 1, 1, 1);
      tempmsg+= Sheet.getSheetValues(Row-1, 2, 1, 1);
      replymsg(tempmsg, replyToken);
      Sheet.getRange(Row-1,1).setValue("");
      Sheet.getRange(Row-1,2).setValue("");
      if(Sheet.getSheetValues(2,5,1,1) == 1 && userId != momUserid){
        SendMsgToMom(tempmsg);
      }
      return;
    case "測試":
      Normalmessage(20,"晚餐","1222",50,23,1,replyToken);
      return;
    default:
      LastRow = 62-Row;
      if(LastRow <=0){
        replymsg("已滿載，請結算", replyToken);
        return;
        }
      Sheet.getRange(Row, 1).setValue(userMessage); //將傳送了來的訊息寫入試算表
      var check = Sheet.getSheetValues(Row,3,1,1); //取得資料有無報錯
      if(check == "error"){
        Sheet.getRange(Row, 1).setValue(""); //重新寫入
        replymsg("資料錯誤，請重新輸入", replyToken);
        return;
      }
      var Money = Sheet.getSheetValues(Row,3,1,1); //取得傳送了多少錢
      var Thing = userMessage;
      var Sum = Sheet.getSheetValues(2,4,1,1); //取得已累積多少錢
      var Switch = Sheet.getSheetValues(2,5,1,1); 
      var reviewmsg = `你又多了 ${Money}元 囉\n已經累積了 ${Sum} 元了`
      var formattedDate = Utilities.formatDate(new Date(), "GMT+8", "MMdd");
      Sheet.getRange(Row, 2).setValue(formattedDate); //將傳送了來的日期寫入試算表

      //發送訊息內容
      Normalmessage(Money, Thing, formattedDate, Sum, 62-Row, Switch, replyToken, 0, reviewmsg);

      if(Sheet.getSheetValues(2,5,1,1) == 1 && userId != momUserid){
        Normalmessage(Money, Thing, formattedDate, Sum, 62-Row, Switch, replyToken, 1, reviewmsg);
      }
  }
}

//回覆訊息
function replymsg(replymessage, replyToken){
  var replyurl = 'https://api.line.me/v2/bot/message/reply'
  UrlFetchApp.fetch(replyurl, {
      'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': replyToken,
      'messages': [{
        'type': 'text',
        'text': replymessage,
      }],
    }),
  });
}

//發訊息給mom
function SendMsgToMom(sendmessage){
  var pushurl = 'https://api.line.me/v2/bot/message/push';
  UrlFetchApp.fetch(pushurl, {
      'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'to': momUserid,
      'messages': [{
        'type': 'text',
        'text': sendmessage,
      }],
    }),
  });
}

//Flex Message
function Normalmessage(money, thing, date, sum, space, notiswitch, replyToken, whethertomom, reviewmsg){
  if(whethertomom == 0){
    var Url = 'https://api.line.me/v2/bot/message/reply'
  }else{
    var Url = 'https://api.line.me/v2/bot/message/push'
  }
  

  UrlFetchApp.fetch(Url, {
      'headers': {
      'Content-Type': 'application/json; charset=UTF-8',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    },
    'method': 'post',
    'payload': JSON.stringify({
      'replyToken': (whethertomom == 0)? replyToken: null,
      'to': (whethertomom == 0)? null: momUserid,
      'messages': [{
        "type": "flex",
        "altText": reviewmsg,
        "contents": {
            "type": "bubble",
            "hero": {
              "type": "image",
              "url": "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_1_cafe.png",
              "size": "full",
              "aspectRatio": "20:13",
              "aspectMode": "cover"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "NT$"+money,
                  "weight": "bold",
                  "size": "3xl"
                },
                {
                  "type": "text",
                  "text": thing,
                  "weight": "regular",
                  "size": "xl"
                },
                {
                  "type": "box",
                  "layout": "vertical",
                  "margin": "lg",
                  "spacing": "none",
                  "contents": [
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "xxl",
                      "contents": [
                        {
                          "type": "text",
                          "text": "日期",
                          "color": "#aaaaaa",
                          "size": "md",
                          "flex": 2
                        },
                        {
                          "type": "text",
                          "text": date,
                          "wrap": true,
                          "color": "#666666",
                          "size": "md",
                          "flex": 5
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "xxl",
                      "contents": [
                        {
                          "type": "text",
                          "text": "已累積",
                          "color": "#aaaaaa",
                          "size": "md",
                          "flex": 2
                        },
                        {
                          "type": "text",
                          "text": sum +"元",
                          "wrap": true,
                          "color": "#666666",
                          "size": "md",
                          "flex": 5
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "xxl",
                      "contents": [
                        {
                          "type": "text",
                          "text": "剩餘格數",
                          "color": "#aaaaaa",
                          "size": "md",
                          "flex": 2
                        },
                        {
                          "type": "text",
                          "text": space+"格",
                          "wrap": true,
                          "color": "#666666",
                          "size": "md",
                          "flex": 5
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "xxl",
                      "contents": [
                        {
                          "type": "text",
                          "text": "通知開關",
                          "color": "#aaaaaa",
                          "size": "md",
                          "flex": 2
                        },
                        {
                          "type": "text",
                          "text": (notiswitch==1)? "開":"關",
                          "wrap": true,
                          "color": "#666666",
                          "size": "md",
                          "flex": 5
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          }
        
        }
      ],
    }),
  });
}
