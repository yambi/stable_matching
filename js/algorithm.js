function mcur2step(mcur){
    step = {}
    for(var i=0;i<m_size;++i){
        if(mcur[i]<mpref[i].length)step[i]=mcur[i];
    }
    return step;
}

//一人ずつ追加型
function solve_da(){
    steps = [{}];
    
    var mcur = []; // man i's partner (rank)
    var wcur = []; // woman i's partner (rank)
    for(var i=0;i<m_size;++i)mcur[i]=mpref[i].length;
    for(var i=0;i<w_size;++i)wcur[i]=wpref[i].length;
    
    for(var i=0;i<m_size;++i){
        mcur[i]=0;
        steps.push(mcur2step(mcur));
        var j = i;
        while(true){
            if(mcur[j]>=mpref[j].length)break;// unmatchable
            var nw = mpref[j][mcur[j]];// j's new partner
            if(j in winv[nw]){ // j is acceptable by nw
                if(winv[nw][j]>wcur[nw])mcur[j]++; // proposal is rejected
                else{//accepted
                    if(wcur[nw]<wpref[nw].length){// nw has another partner
                        var nm = wpref[nw][wcur[nw]];
                        mcur[nm]++;
                        wcur[nw]=winv[nw][j];
                        j = nm;
                    }
                    else{ 
                        wcur[nw]=winv[nw][j];
                        break;
                    }
                }
            }
            else mcur[j]++;
            steps.push(mcur2step(mcur));
        }
    }
    // draw_matching(mcur);

    update_position(0);
}

//ラウンド型
function solve_da_sim(){
    steps = [{}];
    
    var mcur = []; // man i's partner (rank)
    var wcur = []; // woman i's partner (rank)
    for(var i=0;i<m_size;++i)mcur[i]=-1;
    for(var i=0;i<w_size;++i)wcur[i]=wpref[i].length;
    var rejected = {}
    for(var i=0;i<m_size;++i)rejected[i]=true;

    while(true){
        // propose
        for(var i in rejected){
            mcur[i]++;
            if(mcur[i]<mpref[i].length){
                var nw = mpref[i][mcur[i]];
                if(i in winv[nw])wcur[nw] = Math.min(wcur[nw],winv[nw][i]);
            }
        }
        steps.push(mcur2step(mcur));

        // reject
        rejected = {};
        for(var i=0;i<m_size;++i){
            if(mcur[i]>=mpref[i].length)continue;
            var nw = mpref[i][mcur[i]];// i's new partner
            if((!(i in winv[nw])) || winv[nw][i]>wcur[nw]){ 
                rejected[i]=true;
            }
        }
        if(Object.keys(rejected).length==0)break;
        var mres = []
        for(var i=0;i<m_size;++i){
            if(i in rejected)mres[i]=mpref[i].length;
            else mres[i]=mcur[i];
        }
        steps.push(mcur2step(mres));
    }
    update_position(0);
}


//ラウンド型
function solve_boston(){
    steps = [{}];
    
    var mcur = []; // man i's partner (rank)
    var wcur = []; // woman i's partner (rank)
    for(var i=0;i<m_size;++i)mcur[i]=-1;
    for(var i=0;i<w_size;++i)wcur[i]=wpref[i].length;

    var munfix = {};
    var wunfix = {};
    for(var i=0;i<m_size;++i)munfix[i]=true;
    for(var i=0;i<w_size;++i)wunfix[i]=true;


    while(true){
        // propose
        for(var i in munfix){
            mcur[i]++;
            while(mcur[i]<mpref[i].length && (!(mpref[i][mcur[i]] in wunfix)))mcur[i]++;
            if(mcur[i]<mpref[i].length){
                var nw = mpref[i][mcur[i]];
                if(i in winv[nw])wcur[nw] = Math.min(wcur[nw],winv[nw][i]);
            }
        }
        steps.push(mcur2step(mcur));

        // reject
        for(var i in munfix){
            if(mcur[i]>=mpref[i].length)delete munfix[i];
            else{
                var nw = mpref[i][mcur[i]];// i's new partner
                if((i in winv[nw]) && (i==wpref[nw][wcur[nw]])){ 
                    delete munfix[i];
                    delete wunfix[nw];
                }
            }
        }
        if(Object.keys(munfix).length==0)break;
        var mres = []
        for(var i=0;i<m_size;++i){
            if(i in munfix)mres[i]=mpref[i].length;
            else mres[i]=mcur[i];
        }
        steps.push(mcur2step(mres));
    }
    update_position(0);
}



function solve_eada(){
    steps = [];
    
    var mcur = []; // man i's partner (rank)
    var wcur = []; // woman i's partner (rank)
    var munfix = {};
    var wunfix = {};
    for(var i=0;i<m_size;++i)munfix[i]=true;
    for(var i=0;i<w_size;++i)wunfix[i]=true;

    while(Object.keys(munfix).length>0){
        for(var i in munfix)mcur[i]=mpref[i].length;
        for(var i in wunfix)wcur[i]=wpref[i].length;
        steps.push(mcur2step(mcur));
        var demand = {}
        for(var i in wunfix)demand[i]=0;
        var j;
        for(var i in munfix){
            mcur[i]=0;
            steps.push(mcur2step(mcur));
            j = i;
            while(true){
                if(mcur[j]>=mpref[j].length)break;// unmatchable
                var nw = mpref[j][mcur[j]];// j's new partner
                if((j in winv[nw]) && (nw in wunfix)){ // j is acceptable by nw
                    demand[nw]++;
                    if(winv[nw][j]>wcur[nw])mcur[j]++; // proposal is rejected
                    else{//accepted
                        if(wcur[nw]<wpref[nw].length){// nw has another partner
                            var nm = wpref[nw][wcur[nw]];
                            mcur[nm]++;
                            wcur[nw]=winv[nw][j];
                            j = nm;
                        }
                        else{ 
                            wcur[nw]=winv[nw][j];
                            break;
                        }
                    }
                }
                else mcur[j]++;
                steps.push(mcur2step(mcur));
            }
        }
        for(var i in wunfix){
            if(demand[i]<=1){
                delete wunfix[i];
                delete munfix[wpref[i][wcur[i]]];
            }
        }
        for(var i in munfix){
            if(mcur[i]>=mpref[i].length)delete munfix[i];
        }
        // delete munfix[j];
        // if(mcur[j]<mpref[j].length)delete wunfix[mpref[j][mcur[j]]];
    }

    update_position(0);
}


function solve_sd(){
    steps = [{}];
    
    var mcur = []; // man i's partner (rank)
    var wunfix = {};
    for(var i=0;i<m_size;++i)mcur[i]=mpref[i].length;
    for(var i=0;i<w_size;++i)wunfix[i]=true;
    
    for(var i=0;i<m_size;++i){
        mcur[i]=0;
        while((mcur[i]<mpref[i].length) && ((!(mpref[i][mcur[i]] in wunfix)) || (!(i in winv[mpref[i][mcur[i]]])))){
            steps.push(mcur2step(mcur));
            mcur[i]++;
        }
        if(mcur[i]<mpref[i].length)delete wunfix[mpref[i][mcur[i]]];
        steps.push(mcur2step(mcur));
    }
    update_position(0);
}


function solve_ttc(){
    steps = [{}];
    
    var mcur = []; // man i's partner (rank)
    var wcur = []; // woman i's partner (rank)
    for(var i=0;i<m_size;++i)mcur[i]=0;
    for(var i=0;i<w_size;++i)wcur[i]=0;
    var munfix = {};
    var wunfix = {};
    for(var i=0;i<m_size;++i)munfix[i]=true;
    for(var i=0;i<w_size;++i)wunfix[i]=true;

    while(Object.keys(munfix).length>0){
        var m = Object.keys(munfix)[0];
        var next_m = {};
        var next_w = {};
        //find cycle
        var visited = [];
        for(var i=0;i<m_size;++i)visited[i]=false;
        while(!visited[m]){
            visited[m]=true;
            if(mcur[m]>=mpref[m].length)break;
            var w=mpref[m][mcur[m]];
            m=wpref[w][wcur[w]];
        }
        //fix cycle
        var s=m;
        do{
            delete munfix[m];
            if(mcur[m]==mpref[m].length)break;
            var w=mpref[m][mcur[m]];
            delete wunfix[w];
            m=wpref[w][wcur[w]];
        }while(s!=m);
        //update pointer
        for(var w in wunfix){
            while(wcur[w]<wpref[w].length && !(wpref[w][wcur[w]] in munfix))wcur[w]++;
            if(wcur[w] == wpref[w].length)delete wunfix[w];
        }
        for(var m in munfix){
            while(mcur[m]<mpref[m].length && !(mpref[m][mcur[m]] in wunfix))mcur[m]++;
        }

        var mfixed = [];
        for(var i=0;i<m_size;++i){
            if(i in munfix)mfixed[i]=mpref[i].length;
            else mfixed[i]=mcur[i];
        }
        steps.push(mcur2step(mfixed));
    }
    update_position(0);
}


function solve_da_ttc(){
    steps = [{}];
    
    var mcur = []; // man i's partner (rank)
    var wcur = []; // woman i's partner (rank)
    for(var i=0;i<m_size;++i)mcur[i]=-1;
    for(var i=0;i<w_size;++i)wcur[i]=wpref[i].length;
    var rejected = {}
    for(var i=0;i<m_size;++i)rejected[i]=true;

    while(true){
        // propose
        for(var i in rejected){
            mcur[i]++;
            if(mcur[i]<mpref[i].length){
                var nw = mpref[i][mcur[i]];
                if(i in winv[nw])wcur[nw] = Math.min(wcur[nw],winv[nw][i]);
            }
        }
        // steps.push(mcur2step(mcur));

        // reject
        rejected = {};
        for(var i=0;i<m_size;++i){
            if(mcur[i]>=mpref[i].length)continue;
            var nw = mpref[i][mcur[i]];// i's new partner
            if((!(i in winv[nw])) || winv[nw][i]>wcur[nw]){ 
                rejected[i]=true;
            }
        }
        if(Object.keys(rejected).length==0)break;
        var mres = []
        for(var i=0;i<m_size;++i){
            if(i in rejected)mres[i]=mpref[i].length;
            else mres[i]=mcur[i];
        }
        // steps.push(mcur2step(mres));
    }
    steps.push(mcur2step(mcur));

    // TTC
    var munfix = {};
    var wunfix = {};
    for(var i=0;i<m_size;++i)if(mcur[i]<mpref[i].length)munfix[i]=true;
    for(var i=0;i<w_size;++i)if(wcur[i]<wpref[i].length)wunfix[i]=true;

    while(Object.keys(munfix).length>0){
        var i = Object.keys(munfix)[0];
        var next_m = {}; // envied man
        var next_w = {}; // top woman (rank)
        var j = i;
        // find
        while(!(j in next_m)){
            var k = 0;
            while(!(mpref[j][k] in wunfix)){
                k++;
            }
            var nw = mpref[j][k];
            var nextj = wpref[nw][wcur[nw]];
            next_m[j] = nextj;
            next_w[j] = 0;
            while(mpref[j][next_w[j]]!=nw)next_w[j]++;
            j=nextj;
        }
        // trade
        var start = j;
        do{
            var nw = mpref[j][next_w[j]];
            mcur[j]=next_w[j];
            wcur[nw]=winv[nw][j];
            delete munfix[j];
            delete wunfix[nw];
            j=next_m[j];
        }while(j!=start);
        if(j!=next_m[j])steps.push(mcur2step(mcur));
    }
    update_position(0);
}



function solve_rotation(){
    steps = [];
    
    var mcur = []; // man i's partner (rank)
    var wcur = []; // woman i's partner (rank)
    var munfix = {};
    var wunfix = {};
    for(var i=0;i<m_size;++i)munfix[i]=true;
    for(var i=0;i<w_size;++i)wunfix[i]=true;

    //find woman optimal stable set
    while(Object.keys(wunfix).length>0){
        for(var i in munfix)mcur[i]=mpref[i].length;
        for(var i in wunfix)wcur[i]=wpref[i].length;
        var demand = {}
        for(var i in munfix)demand[i]=0;
        var j;
        for(var i in wunfix){
            wcur[i]=0;
            j = i;
            while(true){
                if(wcur[j]>=wpref[j].length)break;// unmatchable
                var nm = wpref[j][wcur[j]];// j's new partner
                if((j in minv[nm]) && (nm in munfix)){ // j is acceptable by nm
                    demand[nm]++;
                    if(minv[nm][j]>mcur[nm])wcur[j]++; // proposal is rejected
                    else{//accepted
                        if(mcur[nm]<mpref[nm].length){// nw has another partner
                            var nw = mpref[nm][mcur[nm]];
                            wcur[nw]++;
                            mcur[nm]=minv[nm][j];
                            j = nw;
                        }
                        else{ 
                            mcur[nm]=minv[nm][j];
                            break;
                        }
                    }
                }
                else wcur[j]++;

                if(debug)console.table(demand);
            }
        }
        for(var i in munfix){
            if(demand[i]<=1){
                delete munfix[i];
                delete wunfix[mpref[i][mcur[i]]];
            }
        }
        for(var i in wunfix){
            if(wcur[i]>=wpref[i].length)delete wunfix[i];
        }
    }
    if(debug)console.log("woman optimal stable set",mcur,wcur);

    var m_matched = {};
    var w_matched = {};
    for(var i=0;i<m_size;++i)if(mcur[i]<mpref[i].length)m_matched[i]=true;
    for(var i=0;i<w_size;++i)if(wcur[i]<wpref[i].length)w_matched[i]=true;

    if(debug)console.log("matched",m_matched,w_matched);

    steps.push(mcur2step(mcur));

    // rotate to man-optimal stable set
    for(var i in w_matched)wcur[i]++;
    for(var i in w_matched){
        i = parseInt(i);
        if(debug)console.log('find rotation from',i, w_matched);

        if(wcur[i]>=wpref[i].length)continue;
        var mchain = [];
        var wchain = [i];
        var wvisit = {};
        while(true){
            var l = wchain.length;
            var j = wchain[l-1];

            if(debug)console.log('find rotation',mchain,wchain,mcur,wcur,wvisit);
            if((wcur[j]<wpref[j].length) && (!(wpref[j][wcur[j]] in m_matched))){
                wcur[j]++;
                continue;
            }

            // unstable
            if((wcur[j]>=wpref[j].length) || ((l>=2) && ((!(wchain[l-2] in minv[mchain[l-2]])) || (minv[mchain[l-2]][j]<minv[mchain[l-2]][wchain[l-2]])))){
                if(debug)console.log('unstable!');
                if(l==1)break;
                else{
                    mchain.pop();
                    wchain.pop();
                    delete wvisit[wchain[l-2]];
                    wcur[wchain[l-2]]++;
                }
            }
            else if(wchain[l-1] in wvisit){// rotation
                wstart = wchain.pop();
                do{
                    m = mchain.pop();
                    w = wchain.pop();
                    delete wvisit[w];
                    if(debug)console.log('rotate', m,w,mchain,wchain);
                    while(mpref[m][mcur[m]]!=w){
                        mcur[m]--;
                        if(mcur[m]<0){
                            console.log('error!',w,mcur[m],mpref[m]);
                            return;
                        }
                    }
                    wcur[w]++;
                }while(wchain.length>0 && w!=wstart);
                if(mchain.length>0){
                    mchain.pop();
                    delete wvisit[wchain[wchain.length-1]];
                }
                else{
                    wchain.push(wstart);
                }
                steps.push(mcur2step(mcur));
            }
            else{
                var mnext = wpref[j][wcur[j]];
                mchain.push(mnext);
                wchain.push(mpref[mnext][mcur[mnext]]);
                wvisit[wchain[l-1]]=true;
            }
        }
    }

    update_position(0);
}





function calc_IR(){
    if(debug)console.log('calc_IR start');
    var IRlist = []; // rank
    for(var i=0;i<m_size;++i)IRlist[i]={};
    
    // calc man-optimal stable matching
    var mcur = []; // man i's partner (rank)
    var wcur = []; // woman i's partner (rank)
    for(var i=0;i<m_size;++i)mcur[i]=-1;
    for(var i=0;i<w_size;++i)wcur[i]=wpref[i].length;
    var rejected = {}
    for(var i=0;i<m_size;++i)rejected[i]=true;
    while(Object.keys(rejected).length>0){
        for(var i in rejected){
            mcur[i]++;
            if(mcur[i]<mpref[i].length){
                var nw = mpref[i][mcur[i]];
                if(i in winv[nw])wcur[nw] = Math.min(wcur[nw],winv[nw][i]);
            }
        }
        rejected = {};
        for(var i=0;i<m_size;++i){
            if(mcur[i]>=mpref[i].length)continue;
            var nw = mpref[i][mcur[i]];// i's new partner
            if((!(i in winv[nw])) || winv[nw][i]>wcur[nw]){ 
                rejected[i]=true;
            }
        }
    }

    var m_matched = {};
    var w_matched = {};
    for(var i=0;i<m_size;++i)if(mcur[i]<mpref[i].length)m_matched[i]=true;
    for(var i=0;i<w_size;++i)if(wcur[i]<wpref[i].length)w_matched[i]=true;
    for(var i in m_matched)IRlist[i][mcur[i]]=true;
    var m_mopt = mcur.concat();
    var w_mopt = wcur.concat();


    if(debug)console.log('man-opt:',mcur,wcur)
    // rotate to man-optimal stable set
    for(var i in w_matched)wcur[i]++;
    for(var i in w_matched){
        i = parseInt(i);
        if(debug)console.log('find rotation from',i, w_matched);

        if(wcur[i]>=wpref[i].length)continue;
        var mchain = [];
        var wchain = [i];
        var wvisit = {};
        while(true){
            if(debug)console.log('find rotation',mchain,wchain,mcur,wcur,wvisit);
            var l = wchain.length;
            var j = wchain[l-1];

            if((wcur[j]<wpref[j].length) && (!(wpref[j][wcur[j]] in m_matched))){
                wcur[j]++;
                continue;
            }
            

            // unstable
            if((wcur[j]>=wpref[j].length) || ((l>=2) && ((!(wchain[l-2] in minv[mchain[l-2]])) || (minv[mchain[l-2]][wchain[l-1]]<minv[mchain[l-2]][wchain[l-2]])))){
                if(debug)console.log('unstable!')
                if(l==1)break;
                else{
                    mchain.pop();
                    wchain.pop();
                    delete wvisit[wchain[l-2]];
                    wcur[wchain[l-2]]++;
                }
            }
            else if(wchain[l-1] in wvisit){// rotation
                wstart = wchain.pop();
                do{
                    m = mchain.pop();
                    w = wchain.pop();
                    delete wvisit[w];
                    if(debug)console.log('rotate', m,w,mchain,wchain);
                    while(mpref[m][mcur[m]]!=w){
                        mcur[m]--;
                        if(mcur[m]<0){
                            console.log('error!',w,mcur[m],mpref[m]);
                            return;
                        }
                    }
                    IRlist[m][mcur[m]]=true;
                    wcur[w]++;
                }while(wchain.length>0 && w!=wstart);
                if(mchain.length>0){
                    mchain.pop();
                    delete wvisit[wchain[wchain.length-1]];
                }
                else{
                    wchain.push(wstart);
                }
            }
            else{
                var mnext = wpref[j][wcur[j]];
                mchain.push(mnext);
                wchain.push(mpref[mnext][mcur[mnext]]);
                wvisit[wchain[l-1]]=true;
            }
        }
    }




    //rotate from man optimal matching to woman optimal stable set
    mcur = m_mopt.concat();
    wcur = w_mopt.concat();
    for(var i in m_matched)mcur[i]++;
    for(var i in m_matched){
        i = parseInt(i);

        if(mcur[i]>=mpref[i].length)continue;
        var mchain = [i];
        var wchain = [];
        var mvisit = {};
        while(true){
            if(debug)console.log('find rotation',mchain,wchain,mcur,wcur,wvisit);
            var l = mchain.length;
            var j = mchain[l-1];

            if((mcur[j]<mpref[j].length) && (!(mpref[j][mcur[j]] in w_matched))){
                mcur[j]++;
                continue;
            }

            // unstable
            if((mcur[j]>=mpref[j].length) || ((l>=2) && ((!(mchain[l-2] in winv[wchain[l-2]])) || (winv[wchain[l-2]][mchain[l-1]]<winv[wchain[l-2]][mchain[l-2]])))){
                if(l==1)break;
                else{
                    mchain.pop();
                    wchain.pop();
                    delete mvisit[mchain[l-2]];
                    mcur[mchain[l-2]]++;
                }
            }
            else if(mchain[l-1] in mvisit){// rotation
                mstart = mchain.pop();
                do{
                    m = mchain.pop();
                    w = wchain.pop();
                    delete mvisit[m];
                    if(debug)console.log('rotate', m,w,mchain,wchain);
                    while(wpref[w][wcur[w]]!=m){
                        wcur[w]--;
                        if(wcur[w]<0){
                            console.log('error!',m,wcur[w],wpref[w]);
                            return;
                        }
                    }
                    IRlist[m][mcur[m]]=true;
                    mcur[m]++;
                }while(mchain.length>0 && m!=mstart);
                if(wchain.length>0){
                    wchain.pop();
                    delete mvisit[mchain[mchain.length-1]];
                }
                else{
                    mchain.push(mstart);
                }
            }
            else{
                var wnext = mpref[j][mcur[j]];
                wchain.push(wnext);
                mchain.push(wpref[wnext][wcur[wnext]]);
                mvisit[mchain[l-1]]=true;
            }
        }
    }


    // console.log('IRlist obtained',IRlist,mcur);    
    return IRlist;
}



// calc man-optimal stable matching
function calc_man_optimal(){
    var mcur = []; // man i's partner (rank)
    var wcur = []; // woman i's partner (rank)
    for(var i=0;i<m_size;++i)mcur[i]=-1;
    for(var i=0;i<w_size;++i)wcur[i]=wpref[i].length;
    var rejected = {}
    for(var i=0;i<m_size;++i)rejected[i]=true;
    while(Object.keys(rejected).length>0){
        for(var i in rejected){
            mcur[i]++;
            if(mcur[i]<mpref[i].length){
                var nw = mpref[i][mcur[i]];
                if(i in winv[nw])wcur[nw] = Math.min(wcur[nw],winv[nw][i]);
            }
        }
        rejected = {};
        for(var i=0;i<m_size;++i){
            if(mcur[i]>=mpref[i].length)continue;
            var nw = mpref[i][mcur[i]];// i's new partner
            if((!(i in winv[nw])) || winv[nw][i]>wcur[nw]){ 
                rejected[i]=true;
            }
        }
    }
    return {'mcur':mcur, 'wcur':wcur};
}
// calc woman-optimal stable matching
function calc_woman_optimal(){
    var mcur = []; // man i's partner (rank)
    var wcur = []; // woman i's partner (rank)
    for(var i=0;i<w_size;++i)wcur[i]=-1;
    for(var i=0;i<m_size;++i)mcur[i]=mpref[i].length;
    var rejected = {}
    for(var i=0;i<w_size;++i)rejected[i]=true;
    while(Object.keys(rejected).length>0){
        for(var i in rejected){
            wcur[i]++;
            if(wcur[i]<wpref[i].length){
                var nm = wpref[i][wcur[i]];
                if(i in minv[nm])mcur[nm] = Math.min(mcur[nm],minv[nm][i]);
            }
        }
        rejected = {};
        for(var i=0;i<w_size;++i){
            if(wcur[i]>=wpref[i].length)continue;
            var nm = wpref[i][wcur[i]];// i's new partner
            if((!(i in minv[nm])) || minv[nm][i]>mcur[nm]){ 
                rejected[i]=true;
            }
        }
    }
    return {'mcur':mcur, 'wcur':wcur};
}


