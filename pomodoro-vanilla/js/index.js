// Ta fatt på elementene time, unit og button
var timeTextObject = document.querySelector('.time')
var unitTextObject = document.querySelector('.unit')
var startButton    = document.querySelector('.button')
let timer

//querySelector til to-do list
var form =  document.querySelector("form");
var todoList = document.querySelector("ul");
var button = document.querySelector("button");
var input = document.getElementById("user-todo");


//add an eventListener to the form to capture the user input on the submit event.
form.addEventListener('submit', function(f){
    //I needed to run/use preventDefault to stop the page from refreshing when the user
        //types in his input. 
    //Added f as I used (f) in the parameter of the function. One can add any value here.
    f.preventDefault();
    //Then I call a todoMaker function which I created in the next step to pass it to the 
        //the 'input' variable to target the value that the user will enter.
    todoMaker(input.value);
    //Finally, here left the input.value blank or an empty string to take let the user enter whatever he/she wants to.
    input.value = '';
});

// Step 2 -> A todoMaker is a that will capture what 
    // user types in the input and enters submit a 'li' list is created.
var todoMaker = function (text){
    var todo = document.createElement('li');
    todo.textContent = text;
    todoList.appendChild(todo);
    
    //syntax of appendChild is node.appendChild(node). The node object is required which you 
        //want to append. The appendChild() method appends a node as the last child of a node.
}

// Step 3 -> Attach an event listener to the `clear all` button when the user clicks.
    // In the function, used a while loop checking to see whether there
      // is an li element as a child of the `ul` tag. In the code block, used the
      // removeChild() DOM method to remove that `li`, using the firstChild property.
button.addEventListener('click', function(){
    while (todoList.firstChild){
        todoList.removeChild(todoList.firstChild);
    }
});

//I also wanted to create a cross button and append it to each node list. So use createElement
    // START ADD DELETE BUTTON






//the pomodora code starts here
let time = {
    minutes:25,
    seconds:0
}

startButton.addEventListener('click', ()=>{
    startButton.classList.add('hidden')
    timer = setInterval(tick, 1000)
    showDuration()
})


//appens 'motor', runs after every sec
const tick = () => {
    if(time.minutes == 0 && time.seconds == 0){
        alarm()
    }else{
        countDown()
        showDuration()
    }
}

const alarm = () =>{
    clearInterval(timer)
    timeTextObject.innerHTML = 'AlARM'
    setTimeout(()=>{
        time = {
            minutes:25,
            seconds:0
    }
    startButton.classList.remove('hidden')
    unitTextObject.classList.remove('hidden')
    timeTextObject.innerHTML = '25'
    }, 5000)
}


//vis tiden 
const showDuration = () => {
    let minutes = time.minutes < 10 ? '0' + time.minutes : time.minutes
    let seconds = time.seconds < 10 ? '0' + time.seconds : time.seconds
    timeTextObject.innerHTML = `${minutes}:${seconds}`

}

//telle tiden ned
const countDown = () => {
    time.seconds = time.seconds - 1
    if(time.seconds < 0){
        time.minutes = time.minutes -1
        time.seconds = 59
    }
}



//Vi skal bruke fire funksjoner: 
//start timeren (klikk på startknapp)
//vis tiden (sett minutter og sekunder inn på siden)
//tell tiden ned (trekk sekunder/minutter fra)
//gørt dette hvert sekund, og husk og sjekke om alarmen skal ringe (tick) 

//opprett en listener på startknap, og kald en funktion, start
//denne funksjon fjerner startknappen og ordet 'min' 
//deretter setter den et interval på et sekund, som hver gang kalder funksjonen tick
//til slutt må den oppdatere tiden på skjermen med å kalde funksjonen showDuration()

//oprett en funksjon tick, som kjører hvert sekund
//sjekk om alarmen skal ringe - reset timer og tidsobjekt 
//ellers, kald countdown og showduration

//oprett en funksjon, showduration som viser tiden
//hvis sekunder er mindre end 10  sett et 0 inn foran  
//hvis minutter er mindre end 10  sett et 0 inn foran  

//oprett en funksjon, countDown som trekker et sekund fra 
//hvis sekunder er mindre enn null - trekk et minutt fra og sett sekunder til 59














