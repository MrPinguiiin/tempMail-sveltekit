<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
  
    let tempEmail = "anjayani@beanbill.online";
    let inbox: any[] = [];
    let interval: number | null = null;
    
    async function checkInbox() {
      const response = await fetch(`/api/inbox?email=${tempEmail}`);
      const newEmails = await response.json();
      inbox = newEmails;
    }
  
    onMount(() => {
      interval = setInterval(checkInbox, 3000);
    });
    
    onDestroy(() => {
      if (interval) {
        clearInterval(interval);
      }
    });
  </script>
  
  <h1>Kotak Masuk untuk: {tempEmail}</h1>
  
  {#each inbox as email}
    <div>
      <p><strong>From:</strong> {email.from}</p>
      <p><strong>Subject:</strong> {email.subject}</p>
      <hr/>
    </div>
  {:else}
    <p>Menunggu email masuk...</p>
  {/each}