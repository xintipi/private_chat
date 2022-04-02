<template>
  <form @submit.prevent="onSubmitLogin" v-if="!isLoggedIn">
    <input v-model="username" type="text" placeholder="username">
    <button type="submit">Login</button>
  </form>
  <div class="grid grid-cols-12 gap-4" v-else>
    <div class="col-span-3">
      <ul>
        <li v-for="user in users" :key="user.userId">
          <button @click="onSelectedUserToSend(user)">
            <span>{{ user.username }}</span>
            <span class="inline-block w-1 h-1 rounded-full bg-green-500"></span>
          </button>
        </li>
      </ul>
    </div>
    <div class="col-span-9" v-if="selectedUserToSend">
      <div class="flex items-center">
        <span class="inline-block w-1 h-1 rounded-full bg-green-500"></span>
        <span>{{ selectedUserToSend.username }}</span>
      </div>
      <div class="flex flex-col">
        <div v-for="message in selectedUserToSend.messages" :key="JSON.stringify(message)" class="flex">
          <div><b>{{ message.isSelf ? "You" : selectedUserToSend.username }}:</b></div>
          <div>{{ message.message }}</div>
        </div>
      </div>
      <div class="flex">
        <form @submit.prevent="onSendMessage">
          <input v-model="message" type="text" placeholder="your message...">
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import {defineComponent, ref, onMounted} from 'vue';
import socket from "./plugins/socket";

export default defineComponent({
  name: 'App',
  setup() {
    const username = ref('')
    const isLoggedIn = ref(false)
    const users = ref([])
    const selectedUserToSend = ref()
    const message = ref()

    onMounted(() => {
      socket.on("getUsers", data => {
        data.forEach(user => {
          user.self = user.userId === socket.id
        })

        // sort
        users.value = data.sort((a, b) => {
          if (a.self) return -1;
          if (b.self) return 1;
          if (a.username < b.username) return -1;
          return a.username > b.username ? 1 : 0;
        })
      })

      socket.on("userJustConnected", data => {
        users.value.push(data)
      })

      socket.on("privateMessageToReceiver", ({message, from}) => {
        for (let i = 0; i < users.value.length; i++) {
          const user = users.value[i]

          if (user.userId === from) {
            if (!user.messages) user.messages = []
            user?.messages.push({message, isSelf: false})
            console.log(selectedUserToSend.value);
            if (user.userId !== selectedUserToSend.value.userId) user.isHasNewMessage = true
            break;
          }
        }
      })
    })

    const onSubmitLogin = () => {
      isLoggedIn.value = true
      socket.auth = {
        username: username.value,
        token: 'token_?'
      }
      socket.connect()
    }

    const onSelectedUserToSend = (user) => {
      selectedUserToSend.value = user
    }

    const onSendMessage = () => {
      socket.emit('privateMessage', {
        message: message.value,
        to: selectedUserToSend.value.userId
      })
      if (!selectedUserToSend.value.messages) selectedUserToSend.value.messages = []
      selectedUserToSend.value?.messages.push({message, isSelf: true})
    }

    return {
      username,
      users,
      isLoggedIn,
      selectedUserToSend,
      message,
      onSubmitLogin,
      onSelectedUserToSend,
      onSendMessage
    }
  },
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
