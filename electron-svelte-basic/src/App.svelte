<script>
	let info = 'Nothing special yet :)';

	const showNotification = () => {
		let myNotification = new Notification('Hello', {
			body: 'You are now officially a part of the system OS'
		})
		myNotification.onclick = () =>{
			info = 'Notification clicked'
		}
	}

	const amIonline = () => {
		window.alert(navigator.onLine ? 'you\'re online sirs' : 'you\'re offline')
		info = 'Alert accepted'
	}
</script>
<main>
	<h1>Svelte in Electron</h1>
	<p>{info}</p>
	<button on:click={ () => showNotification() }>Klikk på meg</button>
	<button on:click={ () => amIonline() }>Online?</button>
</main>

<style>

</style>