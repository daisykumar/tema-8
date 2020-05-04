//CLOSE BUTTONS
var closeButton = document.getElementsByClassName("close");

//CREATING TO-DOS FUNCTION
function createNewElement(){
    var li = document.createElement('li');
    var theInputValue = document.getElementById("the-input").value;
    var textNode = document.createTextNode(theInputValue);
    li.appendChild(textNode);
    
    if(theInputValue === ''){
        alert("Hey! This cannot be kept empty")
   } else{
        document.getElementById("the-ul").appendChild(li);
    }
    document.getElementById("the-input").value = "";

    var theSpanTag = document.createElement("SPAN");
    var txt = document.createTextNode("\u00D7");
    theSpanTag.className = "close";
    theSpanTag.appendChild(txt);
    li.appendChild(theSpanTag);


    //Removing items when clicked on SPAN CLOSE BUTTON
    for (i = 0; i < closeButton.length; i++){
        closeButton[i].onclick = function(){
            var theDiv = this.parentElement;
            theDiv.style.display = "none";
        }
    }

}

//createNewElement();