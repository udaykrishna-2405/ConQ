import React from 'react';
import { TopContentItem } from '../../types';

interface TopContentTableProps {
  items: TopContentItem[];
}

const TopContentTable: React.FC<TopContentTableProps> = ({ items }) => {
  return (
    <div className="table-container">
      <h3>Top Performing Content</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Platform</th>
            <th>Title</th>
            <th>Engagements</th>
            <th>Eng. Rate</th>
            <th>Published</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.contentId}>
              <td>
                <span className={`platform-badge platform-${item.platform}`}>
                  {item.platform}
                </span>
              </td>
              <td className="content-title">{item.title}</td>
              <td>{item.totalEngagements.toLocaleString()}</td>
              <td>{(item.engagementRate * 100).toFixed(2)}%</td>
              <td>{new Date(item.publishedAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopContentTable;
