var testmode = false;// test preference
var debug = false;
var show_irlist = false;

var svg;
var edges_frame;
var man_frame;
var woman_frame;

var width = 640; // width of svg, width = edge_width + 2* pref_width + 4*r
var height = 640; // height of svg, height = (sep+2*r)*max(m_size, w_size)+sep
var r = 5; // radius of vertices
var edge_width = 150; 
var mpref_width = 100;
var wpref_width = 100;
var sep = 20;
var name_height = 30;
var name_width = 35;
var font_size = 16;
var offset = 5;

var m_size, w_size; // the number of men and women

var mrows, wrows;
var mcells, wcells;
var get_mrow, get_wrow;
var morder = [], worder = [];

var mpref,wpref,minv,winv; // preferences
var mpref_text, wpref_text;
var edges, match;

var MIN_SIZE = 1;
var MAX_SIZE = 16;

var delay = 1000;

var timerLongTouch;
var longTouchTime = 500;
var longTouch = false;

var steps // each step of matching
var position

function getTranslation(transform) {
  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttributeNS(null, "transform", transform);
  var matrix = g.transform.baseVal.consolidate().matrix;
  return [matrix.e, matrix.f];
}

d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};




function kp(event){
    console.log(event);
    if(event.keyCode==13)reset();

    var char = pressedChar(event);
    if (char && !char.match(/\d/)) {
        return false;
    } else {
        return true;
    }
}
function pressedChar(event) {
    var code = 0;
    if (event.charCode === 0) {// Firefox, Safari control code
        code = 0;
    } else if (!event.keyCode && event.charCode) {// Firefox
        code = event.charCode;
    } else if (event.keyCode && !event.charCode) {// IE
        code = event.keyCode;
    } else if (event.keyCode == event.charCode) {// Safari
        code = event.keyCode;
    }
    if (32 <= code && code <= 126) {// not ASCII
        return String.fromCharCode(code);
    } else {
        return null;
    }
}


$(window).keyup(function(e){
    if(e.target.tagName!='BODY')return;
    console.log(e.keyCode,"pressed");
    if(e.keyCode == 65){undo_end();}//a
    if(e.keyCode == 66){undo_step();}//b
    if(e.keyCode == 69){proceed_end();}//e
    if(e.keyCode == 68){toggle_delay();}//d
    if(e.keyCode == 70){proceed_step();}//f
    if(e.keyCode == 73){toggle_irlist();}//i
    if(e.keyCode == 76){$('#load').click();}//l
    if(e.keyCode == 82){reset();}//r
    if(e.keyCode == 83){save();}//s
    if(e.keyCode == 84){transpose();}//t
    if(e.keyCode == 37){undo_step();}//left
    if(e.keyCode == 39){proceed_step();}//right
    if(e.keyCode == 32){show_info();}//space
});


function show_info(){
    $.notify("step "+position+"/"+(steps.length-1),"info");
}

function preflist2text(a){
    var s = a["name"]+": ";
    for(var i=0;i<a['pref'].length;++i){
        if(i>0)s+=' > ';
        s += a['pref'][i];
    }
    return s;
}

function random_pref(n){
    var a = []
    for(var i=0;i<n;++i)a.push(i);
    for(var i=0;i<n;++i){
        j = i+Math.floor((n-i)*Math.random())
        var tmp=a[i];
        a[i]=a[j];
        a[j]=tmp;
    }
    return a;
}

function set_pref_random(s=MAX_SIZE,t=MAX_SIZE){
    mpref = [];
    for(var i=0; i<m_size; i++){
        mpref.push(random_pref(w_size));
        while(mpref[i].length>s)mpref[i].pop();
    }
    wpref = [];
    for(var i=0; i<w_size; i++){
        wpref.push(random_pref(m_size));
        while(wpref[i].length>t)wpref[i].pop();
    }
}

function h(i){
    return sep+name_height*i;
}

function update_reset_button(){
    var replaced = false;
    for(var i=0;i<morder.length;++i){
        if(morder[i]!=i)replaced=true;
    }
    for(var i=0;i<worder.length;++i){
        if(worder[i]!=i)replaced=true;
    }
    if(replaced){
        $('#reset').attr("value","R\u0332ename");
    }
    else{
        $('#reset').attr("value","R\u0332eset");
    }
}

function update_number_area(){
    var selected = $("option:selected", $("#pref_type")).parent()[0].label;
    if(selected == "generate"){
        $("#m_size").prop("disabled", false);
        $("#w_size").prop("disabled", false);
    }
    else{
        $("#m_size").prop("disabled", true);
        $("#w_size").prop("disabled", true);
    }
}

function i2l(i){
    if(i<10)return i;
    else return String.fromCharCode(55 + i);
}


function transpose(){
    var tmp = mpref;
    mpref = wpref;
    wpref = tmp;
    reset_frame();
}

function toggle_delay(){
    if(delay==0){
        delay=1000;
        $.notify("animation on","info");
    }
    else{
        delay=0;
        $.notify("animation off","info");
    }
}

function toggle_irlist(){
    if(show_irlist){
        show_irlist = false;
        $(".irlist").css("stroke-width", 0);
        $.notify("IR-list off","info");
    }
    else{
        show_irlist = true;
        $(".irlist").css("stroke-width", 2);
        $.notify("IR-list on","info");
    }
}




function rename(){
    var inv_morder = []
    for(var i=0;i<m_size;++i){
        inv_morder[morder[i]]=i;
    }
    var inv_worder = []
    for(var i=0;i<w_size;++i){
        inv_worder[worder[i]]=i;
    }
    var _mpref = [];
    for(var i=0;i<m_size;++i){
        _mpref[inv_morder[i]]=[];
        for(var j=0;j<mpref[i].length;++j){
            w=mpref[i][j];
            _mpref[inv_morder[i]].push(inv_worder[w]);
        }
    }
    var _wpref = [];
    for(var i=0;i<w_size;++i){
        _wpref[inv_worder[i]]=[];
        for(var j=0;j<wpref[i].length;++j){
            var m = wpref[i][j];
            _wpref[inv_worder[i]].push(inv_morder[m]);
        }
    }
    mpref = _mpref;
    wpref = _wpref;
    var _position = position;
    var _delay = delay
    delay = 0;
    reset_frame();
    if($('#alg_type').val() != 'sd')update_position(_position);
    delay = _delay;
}

function save(){
    var data = {m:mpref,w:wpref}
    var href = "data:application/octet-stream," + encodeURIComponent(JSON.stringify(data));
    if(m_size==w_size)$('<a href='+href+' download="size'+m_size+'.json" target="_blank">')[0].click()
    else $('<a href='+href+' download="size'+m_size+'-'+w_size+'.json">')[0].click()
}


function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    f = files[0];
    var reader = new FileReader();
    reader.onload = (function(theFile) {
        return function(e) {
            try {
                obj = JSON.parse(e.target.result);
                console.log(obj);
                mpref = obj['m'];
                wpref = obj['w'];
                $("#file_opt").text(theFile['name']);
                $("#file_opt").prop("selected",true);
                $("#file_opt").show();
                $("#file_optgroup").show();
                reset_frame();
                $.notify(theFile['name']+" loaded","success");
                $("#load").val("");
            }
            catch(err) {
                $.notify("load failed","error");
            }
        };
      })(f);
      reader.readAsText(f);
    }
document.getElementById('load').addEventListener('change', handleFileSelect, false);

