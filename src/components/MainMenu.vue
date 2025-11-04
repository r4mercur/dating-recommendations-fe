<script setup>
import Menubar from 'primevue/menubar';
import Avatar from 'primevue/avatar';
import {computed} from "vue";
import {useRoute} from "vue-router";
import {useUserStore} from "@/stores/user.js";
import LogoIcon from '@/assets/mainmenu-logo.svg';

const route = useRoute();
const user = useUserStore();

const items = computed(() => {
  const baseItems = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      to: '/',
      class: 'menu-item-home'
    },
    {
      label: 'About',
      icon: 'pi pi-info-circle',
      to: '/about',
      class: 'menu-item-about'
    }
  ];

  if (user.user !== null) {
    baseItems.splice(1, 0,
        {
          label: 'Matches',
          icon: 'pi pi-heart-fill',
          to: '/matches',
          class: 'menu-item-matches'
        }
    );
    baseItems.splice(2, 0,
        {
          label: 'Chats',
          icon: 'pi pi-send',
          to: '/messages',
          class: 'menu-item-messages'
        }
    );
    baseItems.push(
        {
          label: 'Logout',
          icon: 'pi pi-sign-out',
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

const avatarUrl = computed(() => {
  if (user.avatar) {
    return user.avatar
  } else {
    return "src/assets/avatar.jpg"
  }
});
</script>

<template>
  <header class="main-menu">
    <div class="card">
      <Menubar :model="items">
        <template #start>
          <router-link to="/">
            <img :src="LogoIcon" alt="Logo" class="logo" />
          </router-link>
        </template>
        <template #item="{ item, props, hasSubmenu, root }">
          <router-link
              :to="item.to"
              v-bind="props.action"
              class="menu-item-link"
              :class="{
                'router-link-active': item.to === '/' ? isHomeActive : route.path === item.to,
                [item.class]: true
              }"
          >
            <div class="menu-item-content">
              <i v-if="item.icon" :class="[item.icon, 'menu-item-icon']"></i>
              <span v-if="item.label" class="menu-item-label">{{ item.label }}</span>
            </div>
          </router-link>
        </template>
        <template #end>
          <div v-if="isLoggedId" class="flex items-center gap-2">
            <router-link to="/">
              <Avatar class="image" :image="avatarUrl" shape="circle" />
            </router-link>
          </div>
          <div v-else class="flex items-center gap-2 big-icon-wrapper">
            <router-link to="/login">
              <i class="pi pi-sign-in big-icon"></i>
            </router-link>
          </div>
        </template>
      </Menubar>
    </div>
  </header>
</template>

<style scoped>
.main-menu {
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

.image {
  margin-top: 5px;
}

.card {
  padding: 15px 20px;
}

:deep(.p-menubar) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
}

:deep(.p-menubar-root-list) {
  gap: 10px;
}

.menu-item-link {
  display: flex !important;
  align-items: center !important;
  padding: 12px 20px !important;
  border-radius: 12px !important;
  text-decoration: none !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  font-weight: 500 !important;
  position: relative !important;
  overflow: hidden !important;
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
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3),
              0 4px 15px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1) !important;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2)) !important;
}

.menu-item-link.router-link-active {
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4),
              0 2px 10px rgba(102, 126, 234, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  filter: drop-shadow(0 3px 6px rgba(102, 126, 234, 0.3)) !important;
}

.menu-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-item-icon {
  font-size: 1.1rem !important;
  color: #ffffff !important;
  transition: all 0.3s ease !important;
}

.menu-item-link:hover .menu-item-icon {
  transform: scale(1.1) !important;
  color: #fff !important;
}

.menu-item-label {
  font-size: 0.95rem !important;
  font-weight: 600 !important;
  color: #ffffff !important;
  letter-spacing: 0.02em !important;
}

@media (max-width: 768px) {
  .main-menu {
    margin: 10px;
    border-radius: 15px;
  }

  .menu-item-link {
    padding: 10px 16px !important;
  }

  .menu-item-label {
    font-size: 0.9rem !important;
  }
}

:deep(.p-menubar-end) {
  gap: 12px;
}

:deep(.p-inputtext) {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 10px !important;
  color: #ffffff !important;
  backdrop-filter: blur(10px) !important;
}

:deep(.p-inputtext::placeholder) {
  color: rgba(255, 255, 255, 0.6) !important;
}

:deep(.p-inputtext:focus) {
  border-color: rgba(255, 255, 255, 0.4) !important;
  box-shadow: 0 0 0 0.2rem rgba(255, 255, 255, 0.1) !important;
}

:deep(.p-avatar) {
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  transition: all 0.3s ease !important;
}

:deep(.p-avatar:hover) {
  border-color: rgba(255, 255, 255, 0.5) !important;
  transform: scale(1.05) !important;
}

.menu-item-home.router-link-active {
  background: linear-gradient(135deg, #4fc3f7, #29b6f6) !important;
  box-shadow: 0 5px 15px rgba(79, 195, 247, 0.4),
              0 2px 10px rgba(79, 195, 247, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  filter: drop-shadow(0 3px 6px rgba(79, 195, 247, 0.3)) !important;
}

.menu-item-about.router-link-active {
  background: linear-gradient(135deg, #81c784, #66bb6a) !important;
  box-shadow: 0 5px 15px rgba(129, 199, 132, 0.4),
              0 2px 10px rgba(129, 199, 132, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  filter: drop-shadow(0 3px 6px rgba(129, 199, 132, 0.3)) !important;
}

.menu-item-matches.router-link-active {
  background: linear-gradient(135deg, #e57373, #ef5350) !important;
  box-shadow: 0 5px 15px rgba(229, 115, 115, 0.4),
              0 2px 10px rgba(229, 115, 115, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  filter: drop-shadow(0 3px 6px rgba(229, 115, 115, 0.3)) !important;
}

.menu-item-messages.router-link-active {
  background: linear-gradient(135deg, #ffb74d, #ffa726) !important;
  box-shadow: 0 5px 15px rgba(255, 183, 77, 0.4),
              0 2px 10px rgba(255, 183, 77, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  filter: drop-shadow(0 3px 6px rgba(255, 183, 77, 0.3)) !important;
}

.menu-item-link {
  animation: slideIn 0.5s ease-out;
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

.menu-item-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.menu-item-link:hover .menu-item-icon {
  animation: bounceIn 0.6s ease-in-out;
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

 :deep(.p-menubar) {
   background: transparent !important;
   border: none !important;
   padding: 0 !important;
   display: flex !important;
   align-items: center !important;
 }

:deep(.p-menubar-start) {
  flex: 0 0 20% !important;
  display: flex !important;
  justify-content: center !important;
  padding-right: 20px !important;
}

:deep(.p-menubar-root-list) {
  flex: 1 !important;
  gap: 10px !important;
  justify-content: flex-start !important;
}

:deep(.p-menubar-end) {
  flex: 0 0 auto !important;
  gap: 12px !important;
  margin-left: auto !important;
}

@media (max-width: 768px) {
  :deep(.p-menubar-start) {
    flex: 0 0 15% !important;
    padding-right: 10px !important;
  }
}
.big-icon-wrapper {
  width: 50px;
}
.big-icon {
  color: rgb(224, 45, 45);
  font-size: 1.5rem !important;
}
.logo {
  height: 40px;
  width: auto;
}
</style>