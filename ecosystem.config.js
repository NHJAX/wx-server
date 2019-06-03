module.exports = {
  apps : [{
    name: 'wxApi',
    script: 'node app.js',
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    instances: "max",
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  },
  {
    name: 'Skynet',
    script: 'node skynet.js',
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    instances: "max",
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }
  ,
  {
    name: 'LightningApp',
    script: 'node lightning.js',
    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }
  ]
};
