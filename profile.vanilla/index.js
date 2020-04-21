let name = document.querySelector('#name')

let email = document.querySelector('#email')

let submit = document.querySelector('#submit')

submit.addEventListener('click', okButton)

function okButton(){
    console.log(name.value, email.value)
    greet()
}

function greet(){
    
}
