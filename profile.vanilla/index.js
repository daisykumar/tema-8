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
        form.innerHTML = '<h1>Supert!</h1><p>Hva er din favoritt aktiviter? (Obligatorisk)</p><div><input type="checkbox" id="mat" name="interest" value="mat"><label for="matLaging">Mat laging</label></div><input type="checkbox" id="tv" name="interest" value="se på tv"><label for="tv">Se på tv</label></div><input type="checkbox" id="skog" name="interest" value="skogstur"><label for="skogstur">Skogstur</label></div><p>En rekke informasjoner/spørsmål vi gjerne vil ha fra brukerne men det er optional:</p><label for="antallVenner">Antall venner på skolen?</label><input id="textInput" class="custom" size="32"><label for="totalVenner">Antall venner alt i alt??</label><input id="textInput" class="custom" size="32"><button type="enter">Submit form</button>'
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
