initialize();
function initialize(){
    if(debug)console.log("Initialize");
    svg = d3.select("#viz")
        .append("svg")
        .on("contextmenu",function(){d3.event.preventDefault();})
        .on("touchstart", function(){
            d3.event.preventDefault();
            timerLongTouch = setTimeout(function(){toggle_irlist();}, longTouchTime*2);
        })
        .on("touchmove", function(){
            d3.event.preventDefault();
            clearTimeout(timerLongTouch);
        })
        .on("touchend", function(){
            d3.event.preventDefault();
            clearTimeout(timerLongTouch);
        });


    edges_frame = svg.append("g");
    man_frame = svg.append("g");
    woman_frame = svg.append("g");

    $("#m_size").attr('min',MIN_SIZE);
    $("#m_size").attr('max',MAX_SIZE);
    $("#w_size").attr('min',MIN_SIZE);
    $("#w_size").attr('max',MAX_SIZE);

    reset();
}

function reset(){
    if(debug)console.log("reset");

    // $("#reset").prop("disabled", true); 
    // setTimeout(function(){$("#reset").prop("disabled", false);},500);

    $("#file_optgroup").hide();
    $("#file_opt").hide();
    if($('#reset').attr("value")=="R\u0332ename"){
        rename();
    }
    else if(testmode){
        mpref = [[1,0,2],[0,1,2],[0,1,2]];
        wpref = [[0,2,1],[1,2,0],[0,1,2]];
        reset_frame();
    }
    else if($("option:selected", $("#pref_type")).parent()[0].label == 'generate'){
        //set preferences
        {
            m_size=parseInt($("#m_size").val());
            if(isNaN(m_size))m_size=0;
            if(m_size>MAX_SIZE){
                $("#m_size").val(MAX_SIZE);
                m_size=MAX_SIZE;
            }
            if(m_size<MIN_SIZE){
                $("#m_size").val(MIN_SIZE);
                m_size=MIN_SIZE;
            }
            
            w_size=parseInt($("#w_size").val());
            if(isNaN(w_size))w_size=0;
            if(w_size>MAX_SIZE){
                $("#w_size").val(MAX_SIZE);
                w_size=MAX_SIZE;
            }
            if(w_size<MIN_SIZE){
                $("#w_size").val(MIN_SIZE);
                w_size=MIN_SIZE;
            }
        }
        if($('#pref_type').val() == 'random')set_pref_random();
        if($('#pref_type').val() == 'rand_sp')set_pref_random(3,3);
        if($('#pref_type').val() == 'sorted')set_pref_sorted();
        if(debug)console.log('preference setted',mpref,wpref);
        reset_frame();
    }
    else if($("option:selected", $("#pref_type")).parent()[0].label == 'predefined'){
        var file = "instance/"+$("#pref_type").val()+".json";
        
        $.getJSON(file, function(obj){
            console.log(obj);
            mpref = obj['m'];
            wpref = obj['w'];
            reset_frame();
        });
    }
    else if($("option:selected", $("#pref_type")).parent()[0].label == 'loaded file'){
        $('#load').click();
    }
    else{
        console.log("no reset");
    }    
}
function reset_frame(){
    if(debug)console.log('reset_frame');

    update_pref();
    {
        var m_maxlen = 0, w_maxlen = 0;
        for(var i=0;i<m_size;i++)m_maxlen=Math.max(m_maxlen,mpref[i].length)
        for(var i=0;i<w_size;i++)w_maxlen=Math.max(w_maxlen,wpref[i].length)
        mpref_width = name_width*(m_maxlen+1)+2*r+sep;
        wpref_width = name_width*(w_maxlen+1)+2*r+sep;
        height = name_height*(Math.max(m_size, w_size)+1)+sep*2;
        width = edge_width + mpref_width + wpref_width+sep*2;
        svg.attr("width", width);
        svg.attr("height", height);
    }

    man_frame.attr("transform", "translate(" + sep + "," + 0 + ")");
    woman_frame.attr("transform", "translate(" + (width-wpref_width-sep) + "," + 0 + ")");

    edges_frame.selectAll('*').remove();
    man_frame.selectAll('*').remove();
    woman_frame.selectAll('*').remove();
    if(debug)console.log('setting man frame');
    set_man_frame();    // draw man nodes
    if(debug)console.log('setting woman frame');
    set_woman_frame();  // draw woman nodes
    update_reset_button();
    update_number_area();

    // reset edges
    edges = {}
    match = {}
    for(var i=0;i<m_size;++i){
        edges[i]=edges_frame.append("line")
            .attr('x1', sep+mpref_width)
            .attr('y1', sep+h(i))
            .attr('x2', sep+mpref_width)
            .attr('y2', sep+h(i))
            .attr('class','edge');
    }
    // transpose button
    var button_width = 30;
    var button_height = 18;
    var tb = edges_frame.append('g')
        .attr("transform", "translate(" +  (sep+mpref_width+edge_width/2-button_width/2) + "," + (height-sep-button_height) + ")");
    tb.append('rect')
        .attr('rx',3)
        .attr('ry',3)
        .attr('fill','white')
        .attr("width", button_width)
        .attr("height", button_height);
    tb.append('text')
        .html('&harr;')
        .attr('x',button_width/2)
        .attr('y',button_height/2+4)
        .attr("color","black")
        .style("stroke", "black")
        .style("stroke-width", "2px")
        .style("text-anchor", "middle");
    tb.append('rect')
        .attr("class", "button")
        .attr('rx',3)
        .attr('ry',3)
        .attr("width", button_width)
        .attr("height", button_height)
        .on('click',function(){transpose();})
        .on("touchend", function(){transpose();});
    
    update_irlist();
    if(debug)console.log('IRlist updated');
    reset_steps();
}

function update_pref(){
    if(debug)console.log("update_pref");

    m_size = mpref.length;
    w_size = wpref.length;
    $("#m_size").val(m_size);
    $("#w_size").val(w_size);


    minv=[];
    for(var i=0;i<m_size;++i){
        minv[i]=[];
        for(var j=0;j<mpref[i].length;++j){
            minv[i][mpref[i][j]]=j;
        }
    }
    winv=[];
    for(var i=0;i<w_size;++i){
        winv[i]=[];
        for(var j=0;j<wpref[i].length;++j){
            winv[i][wpref[i][j]]=j;
        }
    }
}

function set_man_frame(){
    morder = [];
    mrows = [];
    mcells = [];
    get_mrow = {};
    mpref_text = {};
    mpref_cell = {};

    mpref.forEach(function(p,i){
        morder[i] = i;
        mrows[i] = man_frame.append('g')
            .attr("class", "mrow")
            .attr("transform", "translate(" + 0 + "," + h(i) + ")")
            .attr("width", mpref_width)
            .attr("height", name_height);


        mrows[i].append('rect')
            .attr("fill","rgba(229,240,228,1)")
            .attr("transform", "translate(0,"+offset+")")
            .attr("id",i)
            .attr("width", mpref_width)
            .attr("height", name_height-offset);

        var ntext = mrows[i].append('text')
            .attr("class","man")
            .attr("transform", "translate(0,"+((name_height+font_size)/2)+")")
            .attr("id",i)
            .text("m"+i2l(i)+":");


        var ncircle = mrows[i].append("circle")
            .attr("transform", "translate(" + (mpref_width-r) + "," + (name_height/2+r) + ")")
            .attr("class","man_circle")
            .attr("id",i)
            .attr("r", r);


        mrows[i].append('rect')
            .attr("class","backpanel")
            .attr("transform", "translate(0,"+offset+")")
            .attr("id",i)
            .attr("width", mpref_width)
            .attr("height", name_height-offset)
            .on("contextmenu",function(){
                d3.event.preventDefault();
                if(mpref[i].length<w_size){
                    for(var w=0;w<w_size;++w){
                        if(mpref[i].indexOf(w)==-1)mpref[i].push(w);
                    }
                    reset_frame();
                }
            })
            .on("touchstart", function(){
                d3.event.preventDefault();
                timerLongTouch = setTimeout(function(){
                    if(mpref[i].length<w_size){
                        for(var w=0;w<w_size;++w){
                            if(mpref[i].indexOf(w)==-1)mpref[i].push(w);
                        }
                        reset_frame();
                    }
                }, longTouchTime);
            })
            .on("touchmove", function(){
                d3.event.preventDefault();
                clearTimeout(timerLongTouch);
            })
            .on("touchend", function(){
                d3.event.preventDefault();
                clearTimeout(timerLongTouch);
            });

        mpref_text[i] = {};
        mpref_cell[i] = {};
        mcells[i] = {};
        p.forEach(function(w,j){
            mcells[i][w] = mrows[i].append('g')
                .attr("transform", "translate(" + (name_width*(j+1)) + "," + 0 + ")")
                .attr("width", name_width)
                .attr("height", name_height);
            mpref_text[i][w] = mcells[i][w].append('text')
                .attr("class","label")
                .attr("id",[i,w])
                .attr("transform", "translate(" + (name_width/2) + "," + ((name_height+font_size)/2) + ")")
                .text("w"+i2l(w));
            mpref_cell[i][w] = mcells[i][w].append('rect')
                .attr("class", "cell")
                .attr("transform", "translate(" + 0 + "," + 0 + ")")
                .attr("id",[i,w])
                .attr("width", name_width)
                .attr("height", name_height)
                .on("contextmenu",function(){
                    d3.event.preventDefault();
                    mpref[i].splice(j,1);
                    reset_frame();
                })
                .on("touchstart", function(){
                    d3.event.preventDefault();
                    timerLongTouch = setTimeout(function(){
                        mpref[i].splice(j,1);
                        reset_frame();
                    }, longTouchTime);
                })
                .on("touchmove", function(){
                    d3.event.preventDefault();
                    clearTimeout(timerLongTouch);
                })
                .on("touchend", function(){
                    d3.event.preventDefault();
                    clearTimeout(timerLongTouch);
                });

        });
        get_mrow[mrows[i]] = i;
        get_mrow[ncircle] = i;
        get_mrow[ntext] = i;
    });


    var d_row;
    var d_col;
    var trigger;
    var prev_order;
    d3.selectAll(".mrow").call(d3.drag()
        .on("start", function(d) {
            trigger = d3.event.sourceEvent.target.className.baseVal;
            if (trigger == "man" || trigger == "man_circle" || trigger == "backpanel") {
                d_row = d3.event.sourceEvent.target.id;
                mrows[d_row].moveToFront();

            }
            if (trigger == "cell" || trigger == "label") {
                var d = d3.event.sourceEvent.target.id.split(',');
                d_row = d[0];
                d_col = d[1];
                mcells[d_row][d_col].moveToFront();
                prev_order = mpref[d_row].concat();
            }
        })
        .on("drag", function(d) {
            if (trigger == "man" || trigger == "man_circle" || trigger == "backpanel") {
                morder.sort(function(a, b) { 
                    return getTranslation(mrows[a].attr("transform"))[1]-getTranslation(mrows[b].attr("transform"))[1];
                });
                for(var i=0;i<m_size;++i){
                    if(morder[i]!=d_row)mrows[morder[i]].attr("transform", "translate(" + 0 + "," + h(i) + ")");
                }
                mrows[d_row]
                    .attr("transform", "translate(" + 0 + "," + man_hbound(d3.event.y) + ")");
                update_edgeposition();
            }
            if (trigger == "cell" || trigger == "label") {
                mpref[d_row].sort(function(a, b) { 
                    return getTranslation(mcells[d_row][a].attr("transform"))[0]-getTranslation(mcells[d_row][b].attr("transform"))[0];
                });
                // console.log(mpref[d_row]);
                for(var i=0;i<mpref[d_row].length;++i){
                    if(mpref[d_row][i]!=d_col)mcells[d_row][mpref[d_row][i]].attr("transform", "translate(" + name_width*(i+1) + "," + 0 + ")");
                }
                var x = d3.event.x;
                x -= name_width/2;
                if(x<name_width/2)x=name_width/2;
                if(x>name_width*(mpref[d_row].length+0.5))x=name_width*(mpref[d_row].length+0.5);
                // console.log(x);
                mcells[d_row][d_col].attr("transform", "translate(" + x + "," + 0 + ")");
            }
        })
        .on("end", function(d) {
            if (trigger == "man" || trigger == "man_circle" || trigger == "backpanel") {
                for(var i=0;i<m_size;++i){
                    mrows[morder[i]].attr("transform", "translate(" + 0 + "," + h(i) + ")");
                }
                update_edgeposition();
                update_reset_button();
            }
            if (trigger == "cell" || trigger == "label") {
                for(var i=0;i<mpref[d_row].length;++i){
                    mcells[d_row][mpref[d_row][i]].attr("transform", "translate(" + name_width*(i+1) + "," + 0 + ")");
                }
                for(var i=0;i<prev_order.length;++i){
                    if(prev_order[i]!=mpref[d_row][i]){
                        reset_frame();
                        break;
                    }
                }
            }
        })
    );

    function man_hbound(y){
        y -= name_height/2;
        var lower = sep-name_height/2;
        var upper = sep+name_height*(m_size-0.5);
        if(y<lower)return lower;
        if(y>upper)return upper;
        return y;
    }
}

function set_woman_frame(){
    worder = [];
    wrows = [];
    wcells = [];
    get_wrow = {};
    wpref_text = {};
    wpref_cell = {};

    wpref.forEach(function(p,i){
        worder[i] = i;
        wrows[i] = woman_frame.append('g')
            .attr("class", "wrow")
            .attr("transform", "translate(" + 0 + "," + h(i) + ")")
            .attr("width", wpref_width)
            .attr("height", name_height);


        wrows[i].append('rect')
            .attr("fill","rgba(229,240,228,1)")
            .attr("transform", "translate(0,"+(offset)+")")
            .attr("id",i)
            .attr("width", wpref_width)
            .attr("height", name_height-offset);

        var ntext = wrows[i].append('text')
            .attr("class","woman")
            .attr("transform", "translate("+(2*r+sep)+","+((name_height+font_size)/2)+")")
            .attr("id",i)
            .text("w"+i2l(i)+":");

        var ncircle = wrows[i].append("circle")
            .attr("transform", "translate(" + (r) + "," + (name_height/2+r) + ")")
            .attr("class","woman_circle")
            .attr("id",i)
            .attr("r", r);

        wrows[i].append('rect')
            .attr("class","backpanel")
            .attr("transform", "translate(0,"+(offset)+")")
            .attr("id",i)
            .attr("width", wpref_width)
            .attr("height", name_height-offset)
            .on("contextmenu",function(){
                d3.event.preventDefault();
                if(wpref[i].length<m_size){
                    for(var m=0;m<m_size;++m){
                        if(wpref[i].indexOf(m)==-1)wpref[i].push(m);
                    }
                    reset_frame();
                }
            })
            .on("touchstart", function(){
                d3.event.preventDefault();
                timerLongTouch = setTimeout(function(){
                    if(wpref[i].length<m_size){
                        for(var m=0;m<m_size;++m){
                            if(wpref[i].indexOf(m)==-1)wpref[i].push(m);
                        }
                        reset_frame();
                    }
                }, longTouchTime);
            })
            .on("touchmove", function(){
                d3.event.preventDefault();
                clearTimeout(timerLongTouch);
            })
            .on("touchend", function(){
                d3.event.preventDefault();
                clearTimeout(timerLongTouch);
            });

        wcells[i] = {};
        wpref_text[i] = {};
        wpref_cell[i] = {};
        p.forEach(function(m,j){
            wcells[i][m] = wrows[i].append('g')
                .attr("transform", "translate(" + (2*r+sep+name_width*(j+1)) + "," + 0 + ")")
                .attr("width", name_width)
                .attr("height", name_height);
            wpref_text[i][m] = wcells[i][m].append('text')
                .attr("class","label")
                .attr("id",[i,m])
                .attr("transform", "translate(" + (name_width/2) + "," + ((name_height+font_size)/2) + ")")
                .text("m"+i2l(m));
            wpref_cell[i][m] = wcells[i][m].append('rect')
                .attr("class", "cell")
                .attr("transform", "translate(" + 0 + "," + 0 + ")")
                .attr("id",[i,m])
                .attr("width", name_width)
                .attr("height", name_height)
                .on("contextmenu",function(){
                    d3.event.preventDefault();
                    wpref[i].splice(j,1);
                    reset_frame();
                })
                .on("touchstart", function(){
                    d3.event.preventDefault();
                    timerLongTouch = setTimeout(function(){
                        wpref[i].splice(j,1);
                        reset_frame();
                    }, longTouchTime);
                })
                .on("touchmove", function(){
                    d3.event.preventDefault();
                    clearTimeout(timerLongTouch);
                })
                .on("touchend", function(){
                    d3.event.preventDefault();
                    clearTimeout(timerLongTouch);
                });
        });
        get_wrow[wrows[i]] = i;
        get_wrow[ncircle] = i;
        get_wrow[ntext] = i;
    });

    var d_row;
    var d_col;
    var trigger;
    var prev_order;
    d3.selectAll(".wrow").call(d3.drag()
        .on("start", function(d) {
            trigger = d3.event.sourceEvent.target.className.baseVal;
            if (trigger == "woman" || trigger == "woman_circle" || trigger == "backpanel") {
                d_row = d3.event.sourceEvent.target.id;
                wrows[d_row].moveToFront();
            }
            if (trigger == "cell" || trigger == "label") {
                var d = d3.event.sourceEvent.target.id.split(',');
                d_row = d[0];
                d_col = d[1];
                wcells[d_row][d_col].moveToFront();
                prev_order = wpref[d_row].concat();
            }
        })
        .on("drag", function(d) {
            if (trigger == "woman" || trigger == "woman_circle" || trigger == "backpanel") {
                worder.sort(function(a, b) { 
                    return getTranslation(wrows[a].attr("transform"))[1]-getTranslation(wrows[b].attr("transform"))[1];
                });
                for(var i=0;i<w_size;++i){
                    if(worder[i]!=d_row)wrows[worder[i]].attr("transform", "translate(" + 0 + "," + h(i) + ")");
                }
                wrows[d_row]
                    .attr("transform", "translate(" + 0 + "," + woman_hbound(d3.event.y) + ")");
                    update_edgeposition();
            }
            if (trigger == "cell" || trigger == "label") {
                wpref[d_row].sort(function(a, b) { 
                    return getTranslation(wcells[d_row][a].attr("transform"))[0]-getTranslation(wcells[d_row][b].attr("transform"))[0];
                });
                // console.log(wpref[d_row]);
                for(var i=0;i<wpref[d_row].length;++i){
                    if(wpref[d_row][i]!=d_col)wcells[d_row][wpref[d_row][i]].attr("transform", "translate(" + (2*r+sep+name_width*(i+1)) + "," + 0 + ")");
                }
                var x = d3.event.x;
                x -= name_width/2;
                if(x<2*r+sep+name_width/2)x=2*r+sep+name_width/2;
                if(x>2*r+sep+name_width*(wpref[d_row].length+0.5))x=2*r+sep+name_width*(wpref[d_row].length+0.5);
                // console.log(x);
                wcells[d_row][d_col].attr("transform", "translate(" + x + "," + 0 + ")");
            }
        })
        .on("end", function(d) {
            if (trigger == "woman" || trigger == "woman_circle" || trigger == "backpanel") {
                for(var i=0;i<w_size;++i){
                    wrows[worder[i]].attr("transform", "translate(" + 0 + "," + h(i) + ")");
                }
                update_edgeposition();
                update_reset_button();
            }
            if (trigger == "cell" || trigger == "label") {
                for(var i=0;i<wpref[d_row].length;++i){
                    wcells[d_row][wpref[d_row][i]].attr("transform", "translate(" + (2*r+sep+name_width*(i+1)) + "," + 0 + ")");
                }
                for(var i=0;i<prev_order.length;++i){
                    if(prev_order[i]!=wpref[d_row][i]){
                        reset_frame();
                        break;
                    }
                }
            }
        })
    );

    function woman_hbound(y){
        y -= name_height/2;
        var lower = sep-name_height/2;
        var upper = sep+name_height*(w_size-0.5);
        if(y<lower)return lower;
        if(y>upper)return upper;
        return y;
    }
}


function reset_steps(){
    if(debug)console.log("reset_steps");
    if($('#alg_type').val() == 'da')solve_da();
    if($('#alg_type').val() == 'da_sim')solve_da_sim();
    if($('#alg_type').val() == 'boston')solve_boston();
    if($('#alg_type').val() == 'sd')solve_sd();
    if($('#alg_type').val() == 'eada')solve_eada();
    if($('#alg_type').val() == 'ttc')solve_ttc();
    if($('#alg_type').val() == 'da+ttc')solve_da_ttc();
    if($('#alg_type').val() == 'rotation')solve_rotation();
}

function reset_if_sizechange(){
    if((m_size!=parseInt($("#m_size").val()))||(w_size!=parseInt($("#w_size").val())))reset();
}


function draw_matching(){
    var inv_morder = []
    for(var i=0;i<m_size;++i){
        inv_morder[morder[i]]=i;
    }
    var inv_worder = []
    for(var i=0;i<w_size;++i){
        inv_worder[worder[i]]=i;
    }
    for(var i=0;i<m_size;++i){
        if(i in steps[position]){
            var j = mpref[i][steps[position][i]];
            edges[i]
                .transition()
                .duration(delay)
                .attr('y1', sep+h(inv_morder[i]))
                .attr('x2', sep+mpref_width+edge_width)
                .attr('y2', sep+h(inv_worder[j]));
        }
        else{
            edges[i]
                .transition()
                .duration(delay)
                .attr('y1', sep+h(inv_morder[i]))
                .attr('x2', sep+mpref_width)
                .attr('y2', sep+h(inv_morder[i]));
        }
    }
    for(var i=0;i<m_size;++i){
        for(var j=0;j<mpref[i].length;++j){
            var w = mpref[i][j];
            if(j==steps[position][i])mpref_text[i][w].transition().duration(delay).attr('fill','red').attr('font-weight','bold');
            else mpref_text[i][w].transition().duration(delay).attr('fill','black').attr('font-weight','normal');
        }
    }
    for(var i=0;i<w_size;++i){
        for(var j=0;j<wpref[i].length;++j){
            var m = wpref[i][j]
            if(i==mpref[m][steps[position][m]])wpref_text[i][m].transition().duration(delay).attr('fill','blue').attr('font-weight','bold');
            else wpref_text[i][m].transition().duration(delay).attr('fill','black').attr('font-weight','normal');
        }
    }

    if(show_irlist){
        $.notify("#justifiable_envy="+count_justifiable_envy(),"info");
    }
}


function update_edgeposition(){
    for(var i=0;i<m_size;++i){
        if(i in steps[position]){
            var j = mpref[i][steps[position][i]];
            edges[i]
                .attr('y1', getTranslation(mrows[i].attr("transform"))[1]+sep)
                .attr('x2', width-(sep+wpref_width))
                .attr('y2', getTranslation(wrows[j].attr("transform"))[1]+sep);
        }
        else{
            edges[i]
                .attr('y1', getTranslation(mrows[i].attr("transform"))[1]+sep)
                .attr('x2', sep+mpref_width)
                .attr('y2', getTranslation(mrows[i].attr("transform"))[1]+sep);
        }
    }
}

function count_justifiable_envy(){
    var res = 0;
    var wcur = [];
    for(var i=0;i<w_size;++i)wcur[i]=m_size;
    for(var i=0;i<m_size;++i){
        if(i in steps[position]){
            var w = mpref[i][steps[position][i]];
            wcur[w] = Math.min(wcur[w],winv[w][i]);
        }
    }
    for(var i=0;i<m_size;++i){
        var k = (i in steps[position])? steps[position][i]:mpref[i].length;
        for(var j=0;j<k;++j){
            var w = mpref[i][j];
            if(wcur[w]>winv[w][i]) res++;
        }
    }
    return res;
}



function update_irlist(){
    var IRlist = calc_IR();
    for(var i=0;i<m_size;++i){
        for(var j in IRlist[i]){
            j=parseInt(j);
            var w = mpref[i][j];
            if(!(i in winv[w]))continue;
            var k = winv[w][i];
            mcells[i][w].append('line')
                .attr('x1', offset)
                .attr('y1', name_height-offset)
                .attr('x2', name_width-offset)
                .attr('y2', name_height-offset)
                .attr('class','irlist');
            wcells[w][i].append('line')
                .attr('x1', offset)
                .attr('y1', name_height-offset)
                .attr('x2', name_width-offset)
                .attr('y2', name_height-offset)
                .attr('class','irlist');
        }
    }
    if(show_irlist)$(".irlist").css("stroke-width", 3);
    else $(".irlist").css("stroke-width", 0);

    var res1 = calc_man_optimal();
    var res2 = calc_woman_optimal();
    for(var i=0;i<=m_size;++i){
        var j1 = res1['mcur'][i];
        var j2 = res2['mcur'][i];
        for(var j=j1;j<=j2;++j){
            if((j<mpref[i].length) && (mpref[i][j] in mcells[i])){
                mcells[i][mpref[i][j]].select('line').style('stroke','#faf');
            }
        }
        // if((j1<mpref[i].length) || (j2<mpref[i].length)){
        //     mcells[i][mpref[i][j1]].select('line').style('stroke','#faf');
        //     mcells[i][mpref[i][j2]].select('line').style('stroke','#faf');
        // }
    }
    for(var i=0;i<w_size;++i){
        var j1 = res1['wcur'][i];
        var j2 = res2['wcur'][i];
        for(var j=j2;j<=j1;++j){
            if((j<wpref[i].length) && (wpref[i][j] in wcells[i])){
                wcells[i][wpref[i][j]].select('line').style('stroke','#faf');
            }
        }
        // if(j1<wpref[i].length){
        //     wcells[i][wpref[i][j1]].select('line').style('stroke','#faf');
        //     wcells[i][wpref[i][j2]].select('line').style('stroke','#faf');
        // }
    }
}


