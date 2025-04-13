import {create} from 'zustand'

type Store = {
    avatarRefresh: boolean
    setAvatarRefresh: (state: boolean) => void
}

const useStore = create<Store>()((set) => ({
    avatarRefresh: false,
    setAvatarRefresh: () => set((state) => ({avatarRefresh: !state.avatarRefresh})),
}))

export default useStore