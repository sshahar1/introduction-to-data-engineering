module.exports = {
  siteMetadata: {
    name: `Sigal Shaharabani`,
    title: `Tikal Knowledge ™ 2020`,
    date: `April 8, 2020`,
  },
  // Security headers on top of Gatsby's defaults (nosniff, x-frame-options,
  // referrer-policy). Everything is same-origin; 'unsafe-inline' is required
  // for Gatsby's per-page inline scripts and inline styles.
  headers: [
    {
      source: `/*`,
      headers: [
        {
          key: `Content-Security-Policy`,
          value: [
            `default-src 'self'`,
            `script-src 'self' 'unsafe-inline'`,
            `style-src 'self' 'unsafe-inline'`,
            `img-src 'self' data:`,
            `font-src 'self'`,
            `connect-src 'self'`,
            `worker-src 'self'`,
            `manifest-src 'self'`,
            `object-src 'none'`,
            `base-uri 'self'`,
            `form-action 'none'`,
            `frame-ancestors 'none'`,
          ].join(`; `),
        },
        {
          key: `Permissions-Policy`,
          value: `camera=(), microphone=(), geolocation=(), payment=(), usb=()`,
        },
      ],
    },
  ],
  plugins: [
    `gatsby-plugin-layout`,
    `gatsby-plugin-offline`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `slides`,
        path: `${__dirname}/src/slides`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          `gatsby-remark-copy-linked-files`,
          {
            resolve: `gatsby-remark-images`,
            options: {
              // It's important to specify the maxWidth (in pixels) of
              // the content container as this plugin uses this as the
              // base for generating different widths of each image.
              maxWidth: 1920,
            },
          },
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
  ],
};
