import React from 'react';
import { TrendAlignmentItem } from '../../types';

interface TrendAlignmentListProps {
  items: TrendAlignmentItem[];
}

const TrendAlignmentList: React.FC<TrendAlignmentListProps> = ({ items }) => {
  return (
    <div className="trend-alignment-container">
      <h3>Trend Alignment</h3>
      <div className="alignment-list">
        {items.map((item, idx) => (
          <div key={`${item.keyword}-${item.contentId}-${idx}`} className="alignment-item">
            <div className="alignment-keyword">{item.keyword}</div>
            <div className="alignment-details">
              <span className={`platform-badge platform-${item.platform}`}>{item.platform}</span>
              <span className="alignment-title">
                {item.contentTitle.length > 40
                  ? item.contentTitle.substring(0, 40) + '...'
                  : item.contentTitle}
              </span>
            </div>
            <div className="alignment-score-bar">
              <div
                className="alignment-score-fill"
                style={{ width: `${item.alignmentScore * 100}%` }}
              />
              <span className="alignment-score-label">
                {(item.alignmentScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendAlignmentList;
