<script setup>
import {computed, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useUserStore} from "@/stores/user.js";
import {useChatStore} from "@/stores/chat.js";
import LogoIcon from '@/assets/mainmenu-logo.svg';
import defaultAvatar from '@/assets/avatar.jpg';

const route = useRoute();
const user = useUserStore();
const chatStore = useChatStore();

/** the item list is a dropdown on narrow screens */
const menuOpen = ref(false);
watch(() => route.path, () => menuOpen.value = false);

const items = computed(() => {
  const baseItems = [
    {
      label: 'Home',
      icon: 'icon-home',
      to: '/',
      class: 'menu-item-home'
    },
    {
      label: 'About',
      icon: 'icon-info-circle',
      to: '/about',
      class: 'menu-item-about'
    }
  ];

  if (user.user !== null) {
    baseItems.splice(1, 0,
        {
          label: 'Matches',
          icon: 'icon-heart-fill',
          to: '/matches',
          class: 'menu-item-matches'
        }
    );
    baseItems.splice(2, 0,
        {
          label: 'Chats',
          icon: 'icon-send',
          to: '/messages',
          badge: chatStore.unreadTotal,
          class: 'menu-item-messages'
        }
    );
    baseItems.push(
        {
          label: 'Logout',
          icon: 'icon-sign-out',
          command: () => {
            user.logout();
          },
          class: 'menu-item-logout'
      }
    );
  }

  return baseItems;
});


const isHomeActive = computed(() => {
  return route.path === '/' || route.path === '/login' || route.path === '/registration';
});

const isLoggedId = computed(() => {
  return user.user !== null;
});

function isActive(item) {
  return item.to === '/' ? isHomeActive.value : route.path === item.to || route.path.startsWith(`${item.to}/`);
}

const avatarUrl = computed(() => user.avatar || defaultAvatar);
</script>

<template>
  <header class="main-menu">
    <div class="card">
      <nav class="menubar" aria-label="Main">
        <div class="menubar-start">
          <router-link to="/">
            <img :src="LogoIcon" alt="Logo" class="logo" />
          </router-link>
        </div>

        <button type="button" class="menubar-button" aria-label="Menu" aria-controls="menubar-list"
                :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
          <i class="icon icon-bars" aria-hidden="true"></i>
        </button>

        <ul id="menubar-list" class="menubar-list" :class="{open: menuOpen}">
          <li v-for="item in items" :key="item.label">
            <button
                v-if="item.command"
                type="button"
                class="menu-item-link"
                :class="item.class"
                @click="item.command"
            >
              <span class="menu-item-content">
                <i v-if="item.icon" :class="['icon', item.icon, 'menu-item-icon']" aria-hidden="true"></i>
                <span v-if="item.label" class="menu-item-label">{{ item.label }}</span>
              </span>
            </button>
            <router-link
                v-else
                :to="item.to"
                class="menu-item-link"
                :class="[item.class, {'router-link-active': isActive(item)}]"
            >
              <span class="menu-item-content">
                <i v-if="item.icon" :class="['icon', item.icon, 'menu-item-icon']" aria-hidden="true"></i>
                <span v-if="item.label" class="menu-item-label">{{ item.label }}</span>
                <span v-if="item.badge" class="menu-badge" :aria-label="`${item.badge} unread`">{{ item.badge }}</span>
              </span>
            </router-link>
          </li>
        </ul>

        <div class="menubar-end">
          <div v-if="isLoggedId" class="end-content">
            <router-link to="/">
              <img class="avatar image" :src="avatarUrl" alt="Profile"/>
            </router-link>
          </div>
          <div v-else class="end-content big-icon-wrapper">
            <router-link to="/login" aria-label="Sign in">
              <i class="icon icon-sign-in big-icon" aria-hidden="true"></i>
            </router-link>
          </div>
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.main-menu {
  position: relative;
  z-index: 100; /* above the views, so the dropdown on narrow screens covers them */
  width: calc(100% - 60px);
  min-height: 80px;
  margin: 15px 30px 0;
  background: linear-gradient(145deg, #34495e, #2c3e50);
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25),
  0 5px 15px rgba(0, 0, 0, 0.15),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.card {
  padding: 15px 20px;
}

.menubar {
  display: flex;
  align-items: center;
}

.menubar-start {
  display: flex;
  flex: 0 0 20%;
  justify-content: center;
  padding-right: 20px;
}

.menubar-list {
  display: flex;
  flex: 1;
  justify-content: flex-start;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.menubar-end {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.end-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.menubar-button {
  display: none;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  font-size: 1.25rem;
  color: #fff;
  background: transparent;
  cursor: pointer;
}

.menubar-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.avatar {
  display: block;
  width: 2rem;
  height: 2rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  object-fit: cover;
  background: var(--ui-surface-700);
  transition: all 0.3s ease;
}

.avatar:hover {
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.image {
  margin-top: 5px;
}

.menu-item-link {
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 12px 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font: inherit;
  font-weight: 500;
  color: #ffffff;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  animation: slideIn 0.5s ease-out;
}

.menu-item-link:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.menu-item-link:hover:before {
  left: 100%;
}

.menu-item-link:hover {
  background: rgba(255, 255, 255, 0.15);
}

.menu-item-link:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.6);
  outline-offset: 2px;
}

.menu-item-link.router-link-active,
.menu-item-logout {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4),
              0 2px 10px rgba(102, 126, 234, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.menu-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-item-icon {
  font-size: 1.1rem;
  color: #ffffff;
  transition: all 0.3s ease;
  animation: pulse 2s infinite;
}

.menu-item-link:hover .menu-item-icon {
  transform: scale(1.1);
  color: #fff;
  animation: bounceIn 0.6s ease-in-out;
}

.menu-item-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.02em;
}

.menu-item-home.router-link-active {
  background: linear-gradient(135deg, #4fc3f7, #29b6f6);
  box-shadow: 0 5px 15px rgba(79, 195, 247, 0.4),
              0 2px 10px rgba(79, 195, 247, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.menu-item-about.router-link-active {
  background: linear-gradient(135deg, #81c784, #66bb6a);
  box-shadow: 0 5px 15px rgba(129, 199, 132, 0.4),
              0 2px 10px rgba(129, 199, 132, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.menu-item-matches.router-link-active {
  background: linear-gradient(135deg, #e57373, #ef5350);
  box-shadow: 0 5px 15px rgba(229, 115, 115, 0.4),
              0 2px 10px rgba(229, 115, 115, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.menu-item-messages.router-link-active {
  background: linear-gradient(135deg, #ffb74d, #ffa726);
  box-shadow: 0 5px 15px rgba(255, 183, 77, 0.4),
              0 2px 10px rgba(255, 183, 77, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1.1);
  }
}

.big-icon-wrapper {
  width: 50px;
}

.big-icon {
  color: rgb(224, 45, 45);
  font-size: 1.5rem;
}

.logo {
  height: 40px;
  width: auto;
}

.menu-badge {
  min-width: 18px;
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  color: #fff;
  background: #ef5350;
}

@media (max-width: 960px) {
  .menubar-button {
    display: flex;
  }

  .menubar-list {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    display: none;
    flex-direction: column;
    padding: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 15px;
    background: #2c3e50;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  }

  .menubar-list.open {
    display: flex;
  }

  .menu-item-link {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .main-menu {
    margin: 10px;
    border-radius: 15px;
  }

  .menu-item-link {
    padding: 10px 16px;
  }

  .menu-item-label {
    font-size: 0.9rem;
  }

  .menubar-start {
    flex: 0 0 15%;
    padding-right: 10px;
  }
}
</style>
