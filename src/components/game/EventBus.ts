class GameEventBus extends EventTarget {
  emit(eventName: string, detail?: any) {
    this.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}

// Singleton event bus to decouple Phaser's 60fps update loop from React's state management
export const GameBus = new GameEventBus();
