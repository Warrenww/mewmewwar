class Cat{
  constructor(obj){
    this.id = obj.id;
    this.name = obj.name;
    this.aoe = obj.aoe;
    this.atk = obj.atk;
    this.atk_period = Number(obj.atk_period)?obj.atk_period.toFixed(2):"-";
    this.atk_speed = Number(obj.atk_speed)?obj.atk_speed.toFixed(2):"-";
    this.cd = obj.cd.toFixed(1);
    this.char = obj.char;
    this.cost = obj.cost;
    this.count = obj.count;
    this.dps = obj.dps;
    this.freq = Number(obj.freq)?obj.freq.toFixed(2):"-";
    this.condition = obj.condition;
    this.hardness = obj.hardness;
    this.hp = obj.hp;
    this.jp_name = obj.jp_name;
    this.kb = obj.kb;
    this.range = obj.range;
    this.rarity = obj.rarity;
    this.region = obj.region;
    this.speed = obj.speed;
    this.tag = obj.tag;
    this.statistic = obj.statistic;
  }
  get Rarity(){
    var arr = ['基本','EX','稀有','激稀有','激稀有狂亂','超激稀有'],
        brr = ['B','EX','R','SR','SR_alt','SSR'];
    return arr[brr.indexOf(this.rarity)]
  }
  get Aoe(){
    return this.aoe?"範圍":"單體"
  }
  get imgURL(){
    return "../public/css/footage/cat/u"+this.id+".png"
  }
  get Period(){
    if(this.atk_period) return this.atk_period.toFixed(2)
    else return "-"
  }
  get Name(){
    if(this.name) return this.name
    else return this.jp_name
  }
  get serial(){
    for(let i in this.char){
      if(this.char[i].arr) return true
    }
    return false
  }
  CharHtml(lv){
    let html = '',char = this.char;
    if(!this.tag) html = '無'
    else{
      for(let k in char){
        if(char[k].type=='波動'){
          html+=char[k].chance+"%的機率 發出Lv"+
          char[k].percent+"的<span id ='type'>"+char[k].type+"</span> (射程:"+
          (132.5+200*char[k].percent)+")</br>"
        }else{
          html +=
          (char[k].against?"對<span id='color'>"+char[k].against+"</span>":"")+
          (char[k].chance?char[k].chance+"%的機率":"")+
          (char[k].lower?"體力小於"+char[k].lower+"%時":"")+
          "<span id='type'>"+char[k].type+"</span>"+
          (char[k].percent?char[k].percent+"%":"")+
          (char[k].range?" "+char[k].range.join("~"):"")+
          (char[k].period?+char[k].period.toFixed(1)+"秒":"");
          if(char[k].arr){
            html += "<span id='serial'>("+this.serialATK(lv)+")</span>"
          }
          html += "</br>";
        }
      }
    }
    return html
  }
  Tovalue(type,lv){
    var origin = this[type],
        limit,result,
        lv_bind = ['hp','dps','hardness','atk',] ;
    if(lv_bind.indexOf(type)==-1) return origin
    switch (this.rarity) {
      case 'R':
      limit = 70 ;
      break;
      case 'SR_alt':
      limit = 20 ;
      break;
      default:
      limit = 60 ;
    }
    result = lv<limit ? (0.8+0.2*lv)*origin : origin*(0.8+0.2*limit)+origin*0.1*(lv-limit) ;
    return result.toFixed(0)
  }
  serialATK(lv){
    var nothing = true ;
    for(let i in this.char){
      if(this.char[i].arr){
        nothing = false ;
        var arr = this.char[i].arr,brr=[];
        for(let j in arr) brr[j] = (arr[j]*this.Tovalue('atk',lv)).toFixed(0);
        return brr
      }
    }
    return ""
  }
  CondHtml(){
    var cond = this.condition;
    var html='';
    html += (cond.lv?"合併等級"+cond.lv+"以上<br>":"")+
    (cond.xp?"XP "+cond.xp+"+<br>":"")+
    (cond.can?"貓罐頭"+cond.can+"個+<br>":"")+
    (cond.stage?"<span type='stage' id='"+cond.stage.id+"'>"+cond.stage.name+"</span>通關後機率獲得<br>":"")+
    (cond.gacha?this.parseGacha(cond.gacha):"")+
    (cond.other?cond.other:"")+
    (cond.fruit?this.parseFruit(cond.fruit):"");
    return html
  }
  parseGacha(gacha) {
    var html = '';
    if (gacha == 'any') html = "再任意稀有轉蛋中獲得";
    else{
      for(let i in gacha){
        name = gacha[i].name;
        name = name=='にゃんこ'?"貓咪":name;
        html += "在<span type='gacha' id='"+gacha[i].id+"'>"+name+"</span>轉蛋中獲得<br>";
      }
    }
    return html
  }
  parseFruit(fruit){
    var html='';
    for(let i in fruit){
      if(!fruit[i]) continue
      html += "<img src='/public/css/footage/fruit/"+(fruit[i].seed?"seed":"fruit")
      +"_icon0"+(Number(i)+1)+".png'/>x"+fruit[i].number
    }
    return html
  }
}

class Enemy{
  constructor(obj){
    this.id = obj.id;
    this.name = obj.name;
    this.jp_name = obj.jp_name;
    this.aoe = obj.aoe;
    this.atk = obj.atk;
    this.atk_speed = Number(obj.atk_speed)?obj.atk_speed.toFixed(2):"-";
    this.char = obj.char;
    this.color = obj.color;
    this.count = obj.count;
    this.dps = obj.dps;
    this.freq = Number(obj.freq)?Number(obj.freq).toFixed(2):"-";
    this.hardness = obj.hardness;
    this.hp = obj.hp;
    this.jp_name = obj.jp_name;
    this.kb = obj.kb;
    this.lv = obj.lv;
    this.range = obj.range;
    this.reward = obj.reward;
    this.speed = obj.speed;
    this.tag = obj.tag;
  }
  get Name(){
    return this.name?this.name:this.jp_name
  }
  get Color(){
    let html = '';
    for(let i in this.color) html+=this.color[i]+"</br>"
    return html
  }
  get Aoe(){
    return this.aoe?"範圍":"單體"
  }
  get imgURL(){
    return "../public/css/footage/enemy/e"+this.id+".png"
  }
  get serial(){
    for(let i in this.char){
      if(this.char[i].arr) return true
    }
    return false
  }
  CharHtml(lv){
    lv=lv?lv:this.lv;
    let html = '',char = this.char;

    if(!this.tag) html = '無'
    else{
      for(let k in char){
        if(char[k].type=='波動'){
          html+=char[k].chance+"%的機率 發出Lv"+
          char[k].percent+"的<span id ='type'>"+char[k].type+"</span> (射程:"+
          (132.5+200*char[k].percent)+")</br>"
        }else{
          html +=
          (char[k].chance?char[k].chance+"%的機率":"")+
          (char[k].lower?"體力小於"+char[k].lower+"%時":"")+
          (char[k].hp?"擊倒後以"+char[k].hp+"%體力":"")+
          (char[k].delay?char[k].delay.toFixed(1)+"秒"+(char[k].hp?"後":"的"):"")+
          "<span id='type'>"+char[k].type+"</span>"+
          (char[k].percent?char[k].percent+"%":"")+
          (char[k].times?char[k].times+"次":"")+
          (char[k].dist?"至後方"+char[k].dist+"("+char[k].time+"F)":"")+
          (char[k].hard?"("+char[k].hard+")":"")+
          (char[k].range?" "+char[k].range.join("~"):"")+
          (char[k].period?+char[k].period.toFixed(1)+"秒":"");
          if(char[k].arr){
            html += "<span id='serial'>("+this.serialATK(lv)+")</span>"
          }
          html += "</br>";
        }
      }
    }
    return html
  }
  Tovalue(type,lv){
    var origin = this[type],
        result,
        lv_bind = ['hp','dps','hardness','atk',] ;
    lv = lv?lv:this.lv;
    if(lv_bind.indexOf(type)==-1) return origin
    else return (origin*lv).toFixed(0)
  }
  serialATK(lv){
    var nothing = true ;
    for(let i in this.char){
      if(this.char[i].arr){
        nothing = false ;
        var arr = this.char[i].arr,brr=[];
        for(let j in arr) brr[j] = (arr[j]*this.Tovalue('atk',lv)).toFixed(0);
        return brr
      }
    }
    return ""
  }
}
