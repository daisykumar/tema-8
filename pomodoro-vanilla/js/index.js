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

form.addEventListener('submit', function(f){
    f.preventDefault();
    todoMaker(input.value);
    input.value = '';
});

// Step 3 -> create a todoMaker function that creates 'li' elements with the text user provides
// from their form and append it to the 'ul'.

var todoMaker = function (text){
    var todo = document.createElement('li');
    todo.textContent = text;
    todoList.appendChild(todo);
}

// Step 4 -> attach an event listener to the `clear all` button listening for a user click.
    // In the function use a while loop checking to see whether there
      // is an li element as a child of the `ul` tag. In the code block use the
      // removeChild() DOM method to removed that `li` using the firstChild property.
button.addEventListener('click', function(){
    while (todoList.firstChild){
        todoList.removeChild(todoList.firstChild);
    }
});
//querySelector til to-do list



let time = {
    minutes:25,
    seconds:0
}

startButton.addEventListener('click', ()=>{
    startButton.classList.add('hidden')
    timer = setInterval(tick, 1000)
    showDuration()
})


//appens 'motor', runs after evert sec
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














