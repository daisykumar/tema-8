<script>

	let name = 'Per'
	let show = false	

</script>

<main>
	{#if show}
	<h1>Hei {name}</h1>

	{:else}
		<h2>nothing to show</h2>
	{/if}
	<input type="text" bind:value={name}>
	<button on:click={ () => show= !show}>Vis Hilsen</button>

</main>

<style>
/* */
	main{
		display: grid;
		place-items: center;
		height: 100vh;
	}
</style>