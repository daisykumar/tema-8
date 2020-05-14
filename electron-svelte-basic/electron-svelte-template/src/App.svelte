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
</script>
<main>
	<h1>Svelte in Electron</h1>
	<p>{info}</p>
	<button on:click={ () => showNotification() }>Klikk på meg</button>
</main>

<style>

</style>