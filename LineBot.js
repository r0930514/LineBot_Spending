var CHANNEL_ACCESS_TOKEN = 'CHANNEL_ACCESS_TOKEN';
var momUserid = 'momUserid'
function doPost(e) {
  //line訊息
  var msg = JSON.parse(e.postData.contents);

  //設定試算表（Sheet）設定
  var SpreadSheet = SpreadsheetApp.openById("1tL1b8AxRrpFaNYlvPODgtpY2fYlF-9YA4UcFiRQCMBo");
  var Sheet = SpreadSheet.getSheetByName("工作表1");

  // 取出 replayToken 和發送的訊息文字
  var replyToken = msg.events[0].replyToken;
  var userMessage = msg.events[0].message.text;
  var userId = msg.events[0].source.userId;
  var msgtype = msg.events[0].message.type;

  if (typeof replyToken === 'undefined' || msgtype != "text") {
    return;
  }

  

  //如果收到"切換！"就執行開關通知
  if(userMessage == "切換！"){
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
  }

  if(userMessage == "明細！"){
    var Sum = Sheet.getSheetValues(2,4,1,1); //取得已累積多少錢
    var rmsg = "";
    var Row = Sheet.getSheetValues(2,6,1,1) - 1;
    for(var i = 2; i <= Row; i++){
      rmsg = rmsg + Sheet.getSheetValues(i, 1, 1, 1) + Sheet.getSheetValues(i,2,1,1)+ "\n";
      }
    rmsg = rmsg + "已累積" + Sheet.getSheetValues(2,4,1,1) + "元";
    replymsg(rmsg, replyToken);
    return;
  }

  if(userMessage == "結算！"){
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
    return;
  }

  var Row = Sheet.getSheetValues(2,6,1,1); //取得要加入第幾行
  Sheet.getRange(Row, 1).setValue(userMessage); //將傳送了來的訊息寫入試算表
  var check = Sheet.getSheetValues(Row,3,1,1); //取得資料有無報錯
  if(check == "error"){
    Sheet.getRange(Row, 1).setValue(""); //重新寫入
    replymsg("資料錯誤，請重新輸入", replyToken);
    return;
  }

  var Money = Sheet.getSheetValues(Row,1,1,1); //取得傳送了多少錢
  var Sum = Sheet.getSheetValues(2,4,1,1); //取得已累積多少錢
  var formattedDate = Utilities.formatDate(new Date(), "GMT+8", "MMdd");
  Sheet.getRange(Row, 2).setValue(formattedDate); //將傳送了來的日期寫入試算表
  
  
  //發送訊息內容
  LastRow = 60-Row;
  var SendMessage = Money + "_" + formattedDate+"\n總共累積金額： "+ Sum +" 元" + "\n剩下 " + LastRow + " 格可以用" ;
  replymsg(SendMessage, replyToken);
  if(Sheet.getSheetValues(2,5,1,1) == 1 && userId != momUserid){
    SendMsgToMom(SendMessage);
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
