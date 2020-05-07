<script>
	const api_key = 'ed87ebff01bb4f5998eed5fb8a0aba89'
	let q = ''
	let article

	const getNews = () => {
		fetch(`https://newsapi.org/v2/everything?q=${q}&apiKey=${api_key}`)
			.then( res => res.json() )
				.then( json => {
					console.log(json.articles[0])
					article = json.articles[0]
				})
	}

</script>

<main>
<header>
	<input placeholder="type to search" type="text" bind:value={q}>
	<button on:click={getNews}>ok</button>
</header>

{#if article}
<a href="{article.url}">
	<div class="article">
		<h1>{ article.title }</h1>
		<p>{article.description}</p>
	</div>
</a>
{:else}
	<h2>Skriv noe og trykk ok..</h2>
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