<script>
	let api_key = 'WyQy5ArEi0aCVW7jcuqPheIw6icalIIE'
  	let q = ''
	const limit = 1
	let gif
	 
	 const getgif = () =>{
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

	<input 
    placeholder="type to search" 
    bind:value={q}  
    on:click={ e => e.target.value=''}
    on:focus={ e => e.target.value = '' }>	
	
	<button on:click={getgif}>Søk</button>
</header>
	
{#if gif}
    <img src="{gif}" alt="{q}">
{:else}
    <h2>Skriv noe og trykk Søk</h2>
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
</style>