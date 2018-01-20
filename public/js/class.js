class Cat{
  constructor(obj){
    this.id = obj.id;
    this.name = obj.name;
    this.aoe = obj.aoe;
    this.atk = obj.atk;
    this.atk_period = obj.atk_period;
    this.atk_speed = obj.atk_speed.toFixed(2);
    this.cd = obj.cd.toFixed(1);
    this.char = obj.char;
    this.cost = obj.cost;
    this.count = obj.count;
    this.dps = obj.dps;
    this.freq = obj.freq;
    this.get_method = obj.get_method;
    this.hardness = obj.hardness;
    this.hp = obj.hp;
    this.jp_name = obj.jp_name;
    this.kb = obj.kb;
    this.range = obj.range;
    this.rarity = obj.rarity;
    this.region = obj.region;
    this.speed = obj.speed;
    this.tag = obj.tag;
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
  get Freq(){
    if(this.freq) return this.freq.toFixed(1)
    else return "-"
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
          (132.5+200*char[k].percent)+")"
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
            html += "<span id='serial'>("+this.serialATK(lv)+")<span>"
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
}
