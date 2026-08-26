import {create} from 'zustand'

type AppStore = {
    avatarRefresh: boolean
    refreshTheme: boolean
    setAvatarRefresh: (state: boolean) => void
    setRefreshTheme: (state: boolean) => void
}

const useAppStore = create<AppStore>()((set) => ({
    avatarRefresh: false,
    refreshTheme: false,
    setAvatarRefresh: () => set((state) => ({avatarRefresh: !state.avatarRefresh})),
    setRefreshTheme: () => set((state) => ({refreshTheme: !state.refreshTheme})),
}))

export default useAppStore