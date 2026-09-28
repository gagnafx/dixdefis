CREATE TABLE IF NOT EXISTS user_account (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  togo_market_balance INTEGER NOT NULL DEFAULT 0 CHECK (togo_market_balance >= 0),
  weekly_earnings INTEGER NOT NULL DEFAULT 0 CHECK (weekly_earnings >= 0),
  last_transfer_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenges (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  reward_fcfa INTEGER NOT NULL CHECK (reward_fcfa >= 0),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO user_account (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO challenges (id, title, reward_fcfa)
VALUES
  (1, 'Rouleaux du Destin', 1000),
  (2, 'Jauge Dorée', 1200),
  (3, 'Rouleaux Précis', 1400),
  (4, 'Jauge Mouvante', 1600),
  (5, 'Rouleaux Rapides', 1800),
  (6, 'Jauge Piégée', 2000),
  (7, 'Rouleaux Extrêmes', 2300),
  (8, 'Jauge Erratique', 2600),
  (9, 'Boss : Rouleaux + Jauge', 3000),
  (10, 'Jauge Finale', 5000)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  reward_fcfa = EXCLUDED.reward_fcfa;