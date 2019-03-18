var CurrentUserID;
var own_data = [],
    current_page = 0,
    total_entry = 0,
    page_size = 50;
$(document).ready(function () {
  auth.onAuthStateChanged(function(user) {
    if (user) {
      socket.emit("user connect",{user:user,page:location.pathname});
    } else {
      window.parent.location.assign("/");
      console.log('did not sign in');
    }
  });
  socket.on("current_user_data",function (data) {
    CurrentUserID = data.uid ;
    if(data.folder.owned)
      socket.emit("required owned",{uid:data.uid,owned:data.folder.owned});
  });
  socket.on("owned data",function (data) {
    own_data = data ;
    own_data = quickSort(own_data,'id');
    // console.log(own_data);
    appendArrange(own_data);
    pageTurn();
  });
  $("select[name='page_size']").on('change',function () {
    var temp = Number($(this).val());
    current_page = Math.ceil(current_page * page_size / temp);
    page_size = temp;
    pageTurn();
  });

  $(".toggle_next").click(function (e) {
    if(e.target == $(".panel[target='view']").prev()[0]){
      setTimeout(()=>{$("#panelBG").css("z-index",2);},100);
    } else {
      $(this).css("transform","rotate(180deg)");
    }
  });
  $(document).on("click","#panelBG",function () { $(".toggle_next").removeAttr("style"); });
  $(document).on("click",".panel span",function () {
    var target = $(this).parent().attr("target"),
        text = $(this).text();
    $(".blink").removeClass("blink");
    switch (target) {
      case "rarity":
          $(".display tbody tr").each(function () {
            var rarity = $(this).children().eq(1).text();
            if(rarity == text) $(this).removeAttr("hidden");
            else $(this).attr('hidden','');
          });
          break;
      case "ability":
          $(".display tbody tr").each(function () {
            var flag = false;
            $(this).children().eq(5).find('span').each(function(){
              if(!flag){
                if($(this).text() == text) {
                  flag =true;
                  $(this).addClass("blink");
                }
              }
            });
            if(flag) $(this).removeAttr("hidden");
            else $(this).attr('hidden','');
          });
          break;
      case "delete":
          var targetID = $(this).parent().siblings("div").text(),
              r = confirm("確定從「我的貓咪圖鑑」中刪除?");
          if(r){
            $(this).parents("tr").remove();
            socket.emit("mark own",{
              uid:CurrentUserID,
              cat:targetID,
              mark:false
            });
          }
          break;
      case "view":
          console.log(text.search("圖示"));
          if(text.search("圖示") == -1){
            $(".display").removeAttr("imgV");
          } else {
            $(".display").attr({"imgV":"","size":text.split("圖示")[0]});
          }
          break;
      default:

    }
    $("#panelBG").click();
  });
  var orgValue;
  $(document).on("click",".editable",function () {
    orgValue = Number($(this).text());
    $(this).html(createHtml("input","",{type:'number',max:100,min:1,value:orgValue}));
    $(this).find("input").focus();
  });
  $(document).on("blur",".editable input",function () {
    var val = Number($(this).val()),
        id = $(this).parent().parent().siblings("th").children().eq(0).text();
    if(Number.isNaN(val)||val<1||val>100) {$(this).parent().html(orgValue);return}
    $(this).parent().html(val);
    console.log(id);
    socket.emit("store level",{
      uid : CurrentUserID,
      id : id,
      lv :val,
      type : 'cat'
    });
  });
});
function appendArrange(arr) {
  var html='',abilityPanel=[],colorPanel=[],panel='',pic_html='';
  total_entry = 0;
  for(let i in arr){
    let temp = arr[i],s = temp.stage?temp.stage:1,tagtext='';
    for (let j in temp.tag) {
      let tag = temp.tag[j];
      if(!tag) continue;
      else if(tag.search('對') == -1 && abilityPanel.indexOf(tag) == -1) abilityPanel.push(tag);
      else if(tag.search('對') != -1 && colorPanel.indexOf(tag) == -1) colorPanel.push(tag);
      tagtext += createHtml('span',tag);
    }
    html +=
      `<tr index="${total_entry}">
        <th>
          <div>${temp.id}</div>
          <span class='toggle_next'pos='right'offsetY='10'></span>
          <div class='panel' target='delete'><span style='color:var(--red)'><i class='material-icons'>delete</i>刪除</span></div>
        </th>
        <td>${Cat.parseRarity(temp.rarity)}</td>
        <td style="padding:0;overflow:hidden">
          <span class='card cat' value='${temp.id}' style='background-image:url("${Unit.imageURL('cat',temp.id+"-"+s)}")'></span>
        </td>
        <td>${temp.name[s-1]}</td>
        <td><div class='editable'>${temp.lv}</div></td>
        <td><div class='flex'>${tagtext}</div></td>
      </tr>`;
    pic_html += `<span class='card cat'value='${temp.id}'name='${temp.name[s-1]}'style='background-image:url("${Unit.imageURL('cat',temp.id+"-"+s)}")'></span>`;
    total_entry ++;
  }

  for(let i in colorPanel){ panel += `<span>${colorPanel[i]}</span>` }
  for(let i in abilityPanel){ panel += `<span>${abilityPanel[i]}</span>` }

  $(".display tbody").empty().append(html);
  $(".display .imageView").empty().append(pic_html);
  $("thead th:last .panel").empty().append(panel);
}
function pageTurn(t = null) {
  var limit = [],temp;
  $(".blink").removeClass("blink");
  if(t > 0){
    temp = (current_page + 1) * page_size;
    if(temp > total_entry) return;
    limit = [temp, temp + page_size];
    current_page ++;
  } else if(t < 0){
    temp = (current_page - 1) * page_size;
    if(temp < 0) return;
    limit = [temp, temp + page_size];
    current_page --;
  } else {
    temp = current_page * page_size;
    if(temp < 0 || temp > total_entry) return;
    limit = [temp, temp + page_size];
  }
  $(".display tbody tr").each(function () {
    var index = $(this).attr('index');
    if(index < limit[0] || index >= limit[1]) $(this).attr("hidden",'');
    else $(this).removeAttr("hidden");
  });
}
