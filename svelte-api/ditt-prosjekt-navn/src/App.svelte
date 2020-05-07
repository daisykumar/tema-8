<script>
	let api_key = 'uoIxjIdZBpcWoyFJB9lMtwIEX3COXZJq'
	const limit = 1
	let q = 'gify'
	let gif 

	const getGify = () => {
		fetch(`https://api.giphy.com/v1/gifs/search?q=${q}&limit=${limit}&api_key=${api_key}`) 
			.then( res => res.json() )
				.then( json => {
					console.log(json)
					 gif = json.data[0].images.downsized_medium.url
				})
	}
</script>

<main>
<header>
	<input placeholder="type to search" type="text" bind:value={q}>
	<button on:click={getGify}>ok</button>
</header>


{#if gif}
    <img src="{gif}" alt="{q}">
{:else}
    <h2>fetching image</h2>
{/if}   

</main>

<style>
	:global(body, html){
		margin:0;
		padding:0;
	}
	:global(*){
		box-sizing:border-box;
	}
	main{
		display:grid;
		place-items:center;
		height:100%;
	}
	header{
		position:absolute;
		top:2rem;
		width:100%;
		display:grid;
		padding: 0 20vw 0 20vw;
	}
	.article{
		width:40vw;
		height:40vh;
		background-color:#eee;
		padding:2rem;
	}


</style>