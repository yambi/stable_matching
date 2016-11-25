function undo_end(){
    if(position!=0)update_position(0);
}
function undo_step(){
    if(position>0)update_position(position-1);
}
function proceed_end(){
    if(position!=steps.length-1)update_position(steps.length-1);
}
function proceed_step(){
    if(position<steps.length-1)update_position(position+1);
}

function update_position(p){
    position = p;
    if(position<0)position=0;
    if(position>=steps.length)position=steps.length-1;
    if(p==0){
        $("#undo_step").prop("disabled", true); 
        $("#undo_end").prop("disabled", true); 
    }
    else{
        $("#undo_step").prop("disabled", false); 
        $("#undo_end").prop("disabled", false); 
    }

    if(p==steps.length-1){
        $("#proceed_step").prop("disabled", true); 
        $("#proceed_end").prop("disabled", true); 
    }
    else{
        $("#proceed_step").prop("disabled", false); 
        $("#proceed_end").prop("disabled", false); 
    }
    draw_matching();
}





