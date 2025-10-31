<script setup>
import Menubar from 'primevue/menubar';
import Avatar from 'primevue/avatar';
import {computed} from "vue";
import {useRoute} from "vue-router";
import {useUserStore} from "@/stores/user.js";

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
  return route.path === '/' || route.path === '/login';
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
          <svg width="35" height="40" viewBox="0 0 35 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-8">
            <path
                d="M25.87 18.05L23.16 17.45L25.27 20.46V29.78L32.49 23.76V13.53L29.18 14.73L25.87 18.04V18.05ZM25.27 35.49L29.18 31.58V27.67L25.27 30.98V35.49ZM20.16 17.14H20.03H20.17H20.16ZM30.1 5.19L34.89 4.81L33.08 12.33L24.1 15.67L30.08 5.2L30.1 5.19ZM5.72 14.74L2.41 13.54V23.77L9.63 29.79V20.47L11.74 17.46L9.03 18.06L5.72 14.75V14.74ZM9.63 30.98L5.72 27.67V31.58L9.63 35.49V30.98ZM4.8 5.2L10.78 15.67L1.81 12.33L0 4.81L4.79 5.19L4.8 5.2ZM24.37 21.05V34.59L22.56 37.29L20.46 39.4H14.44L12.34 37.29L10.53 34.59V21.05L12.42 18.23L17.45 26.8L22.48 18.23L24.37 21.05ZM22.85 0L22.57 0.69L17.45 13.08L12.33 0.69L12.05 0H22.85Z"
                fill="var(--p-primary-color)"
            />
            <path
                d="M30.69 4.21L24.37 4.81L22.57 0.69L22.86 0H26.48L30.69 4.21ZM23.75 5.67L22.66 3.08L18.05 14.24V17.14H19.7H20.03H20.16H20.2L24.1 15.7L30.11 5.19L23.75 5.67ZM4.21002 4.21L10.53 4.81L12.33 0.69L12.05 0H8.43002L4.22002 4.21H4.21002ZM21.9 17.4L20.6 18.2H14.3L13 17.4L12.4 18.2L12.42 18.23L17.45 26.8L22.48 18.23L22.5 18.2L21.9 17.4ZM4.79002 5.19L10.8 15.7L14.7 17.14H14.74H15.2H16.85V14.24L12.24 3.09L11.15 5.68L4.79002 5.2V5.19Z"
                fill="var(--p-text-color)"
            />
          </svg>
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

.menu-item-profile.router-link-active {
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
</style>