window.JapaneseExercises = {
  shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  },
  round(pool, size=10) {
    return this.shuffle(pool).slice(0, Math.min(size, pool.length));
  },
  options(correct, pool, count=4) {
    const others = this.shuffle(pool.filter(k => k.romaji !== correct.romaji));
    const distinct = [];
    for (const item of others) {
      if (item.romaji !== correct.romaji && !distinct.some(x => x.romaji === item.romaji)) distinct.push(item);
      if (distinct.length >= count - 1) break;
    }
    return this.shuffle([correct, ...distinct].slice(0,count));
  }
};
