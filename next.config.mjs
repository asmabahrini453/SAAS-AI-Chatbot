// next.config.mjs
//every time we use a third party provider (exp: cloudways) we configure its domain here
const nextConfig = {
  // Add your configuration options here
  reactStrictMode: false,  
  images:{
    remotePatterns:[
      {
        protocol:'https',
        hostname:'wordpress-1358530-4997755.cloudwaysapps.com'
      }
    ]
  }

};

export default nextConfig;
