import React from 'react';
import { graphql } from 'gatsby';

function extracted() {
  return ({ data, transition }) => (
    <div
      style={transition && transition.style}
      dangerouslySetInnerHTML={{ __html: data.slide.html }}
      className="slide-content"
    />
  );
}

export default extracted();

export const query = graphql`
  query SlideQuery($index: Int!) {
    slide(index: { eq: $index }) {
      html
      index
    }
  }
`;
