let name = document.querySelector('#name')

let email = document.querySelector('#email')

let submit = document.querySelector('#submit')

let form = document.querySelector('#form')

submit.addEventListener('click', okButton)

function okButton(){
    console.log(name.value, email.value)
    greet()
}

function greet(){
    form.innerHTML = '<h1>Hei' + name.value + '</h1>'
    form.innerHTML += '<p>Det var veldig hyggelig med...'
    form.innerHTML += '<p>Om jeg er kjsfjsfjlskf...' + name.value + ' og eposten din er ' + email.value

    const newOKButton = document.createElement('button')
    newOKButton.innerHTML = 'ok'

    newOKButton.addEventListener('click', function(){
        form.innerHTML = '<h1>Supert!</h1>'
    })

    form.appendChild(newOKButton)

    const newCancelButton = document.createElement('button') 
    newCancelButton.innerHTML = 'cancel'

    newCancelButton.addEventListener('click', function(){
        form.innerHTML = ''
        form.appendChild(name)
        form.appendChild(email)
        form.appendChild(submit)
    })
    form.appendChild(newCancelButton)

} 
