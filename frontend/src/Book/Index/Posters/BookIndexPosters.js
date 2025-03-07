import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Grid, WindowScroller } from 'react-virtualized';
import BookIndexItemConnector from 'Book/Index/BookIndexItemConnector';
import Measure from 'Components/Measure';
import dimensions from 'Styles/Variables/dimensions';
import getIndexOfFirstCharacter from 'Utilities/Array/getIndexOfFirstCharacter';
import hasDifferentItemsOrOrder from 'Utilities/Object/hasDifferentItemsOrOrder';
import BookIndexPoster from './BookIndexPoster';
import styles from './BookIndexPosters.css';

// Poster container dimensions
const columnPadding = parseInt(dimensions.authorIndexColumnPadding);
const columnPaddingSmallScreen = parseInt(dimensions.authorIndexColumnPaddingSmallScreen);
const progressBarHeight = parseInt(dimensions.progressBarSmallHeight);
const detailedProgressBarHeight = parseInt(dimensions.progressBarMediumHeight);

const additionalColumnCount = {
  small: 3,
  medium: 2,
  large: 1
};

function calculateColumnWidth(width, posterSize, isSmallScreen) {
  const maxiumColumnWidth = isSmallScreen ? 172 : 182;
  const columns = Math.floor(width / maxiumColumnWidth);
  const remainder = width % maxiumColumnWidth;

  if (remainder === 0 && posterSize === 'large') {
    return maxiumColumnWidth;
  }

  return Math.floor(width / (columns + additionalColumnCount[posterSize]));
}

function calculateRowHeight(posterHeight, sortKey, isSmallScreen, posterOptions) {
  const {
    detailedProgressBar,
    showTitle,
    showAuthor,
    showMonitored,
    showQualityProfile
  } = posterOptions;

  const nextAiringHeight = 19;

  const heights = [
    posterHeight,
    detailedProgressBar ? detailedProgressBarHeight : progressBarHeight,
    nextAiringHeight,
    isSmallScreen ? columnPaddingSmallScreen : columnPadding
  ];

  if (showTitle) {
    heights.push(19);
  }

  if (showAuthor) {
    heights.push(19);
  }

  if (showMonitored) {
    heights.push(19);
  }

  if (showQualityProfile) {
    heights.push(19);
  }

  switch (sortKey) {
    case 'seasons':
    case 'previousAiring':
    case 'added':
    case 'path':
    case 'sizeOnDisk':
      heights.push(19);
      break;
    case 'qualityProfileId':
      if (!showQualityProfile) {
        heights.push(19);
      }
      break;
    default:
      // No need to add a height of 0
  }

  return heights.reduce((acc, height) => acc + height, 0);
}

function calculatePosterHeight(posterWidth) {
  return Math.ceil((400 / 256) * posterWidth);
}

class BookIndexPosters extends Component {

  //
  // Lifecycle

  constructor(props, context) {
    super(props, context);

    this.state = {
      width: 0,
      columnWidth: 182,
      columnCount: 1,
      posterWidth: 162,
      posterHeight: 253,
      rowHeight: calculateRowHeight(253, null, props.isSmallScreen, {}),
      scrollRestored: false
    };

    this._isInitialized = false;
    this._grid = null;
    this._padding = props.isSmallScreen ? columnPaddingSmallScreen : columnPadding;
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      items,
      sortKey,
      posterOptions,
      jumpToCharacter,
      isSmallScreen,
      isEditorActive,
      scrollTop,
      selectedState
    } = this.props;

    const {
      width,
      columnWidth,
      columnCount,
      rowHeight,
      scrollRestored
    } = this.state;

    if (prevProps.sortKey !== sortKey ||
        prevProps.posterOptions !== posterOptions) {
      this.calculateGrid(width, isSmallScreen);
    }

    if (this._grid &&
        (prevState.width !== width ||
            prevState.columnWidth !== columnWidth ||
            prevState.columnCount !== columnCount ||
            prevState.rowHeight !== rowHeight ||
            hasDifferentItemsOrOrder(prevProps.items, items)) ||
            prevProps.isEditorActive !== isEditorActive ||
            prevProps.selectedState !== selectedState) {
      // recomputeGridSize also forces Grid to discard its cache of rendered cells
      this._grid.recomputeGridSize();
    }

    if (this._grid && scrollTop !== 0 && !scrollRestored) {
      this.setState({ scrollRestored: true });
      this._grid.scrollToPosition({ scrollTop });
    }

    if (jumpToCharacter != null && jumpToCharacter !== prevProps.jumpToCharacter) {
      const index = getIndexOfFirstCharacter(items, sortKey, jumpToCharacter);

      if (this._grid && index != null) {
        const row = Math.floor(index / columnCount);

        this._grid.scrollToCell({
          rowIndex: row,
          columnIndex: 0
        });
      }
    }
  }

  //
  // Control

  setGridRef = (ref) => {
    this._grid = ref;
  }

  calculateGrid = (width = this.state.width, isSmallScreen) => {
    const {
      sortKey,
      posterOptions
    } = this.props;

    const columnWidth = calculateColumnWidth(width, posterOptions.size, isSmallScreen);
    const columnCount = Math.max(Math.floor(width / columnWidth), 1);
    const posterWidth = columnWidth - this._padding * 2;
    const posterHeight = calculatePosterHeight(posterWidth);
    const rowHeight = calculateRowHeight(posterHeight, sortKey, isSmallScreen, posterOptions);

    this.setState({
      width,
      columnWidth,
      columnCount,
      posterWidth,
      posterHeight,
      rowHeight
    });
  }

  cellRenderer = ({ key, rowIndex, columnIndex, style }) => {
    const {
      items,
      sortKey,
      posterOptions,
      showRelativeDates,
      shortDateFormat,
      timeFormat,
      selectedState,
      isEditorActive,
      onSelectedChange
    } = this.props;

    const {
      posterWidth,
      posterHeight,
      columnCount
    } = this.state;

    const {
      detailedProgressBar,
      showTitle,
      showAuthor,
      showMonitored,
      showQualityProfile
    } = posterOptions;

    const bookIdx = rowIndex * columnCount + columnIndex;
    const book = items[bookIdx];

    if (!book) {
      return null;
    }

    return (
      <div
        key={key}
        style={{
          ...style,
          padding: this._padding
        }}
      >
        <BookIndexItemConnector
          key={book.id}
          component={BookIndexPoster}
          sortKey={sortKey}
          posterWidth={posterWidth}
          posterHeight={posterHeight}
          detailedProgressBar={detailedProgressBar}
          showTitle={showTitle}
          showAuthor={showAuthor}
          showMonitored={showMonitored}
          showQualityProfile={showQualityProfile}
          showRelativeDates={showRelativeDates}
          shortDateFormat={shortDateFormat}
          timeFormat={timeFormat}
          style={style}
          bookId={book.id}
          authorId={book.authorId}
          isSelected={selectedState[book.id]}
          onSelectedChange={onSelectedChange}
          isEditorActive={isEditorActive}
        />
      </div>
    );
  }

  //
  // Listeners

  onMeasure = ({ width }) => {
    this.calculateGrid(width, this.props.isSmallScreen);
  }

  //
  // Render

  render() {
    const {
      scroller,
      items,
      isSmallScreen
    } = this.props;

    const {
      width,
      columnWidth,
      columnCount,
      rowHeight
    } = this.state;

    const rowCount = Math.ceil(items.length / columnCount);

    return (
      <Measure
        onMeasure={this.onMeasure}
      >
        <WindowScroller
          scrollElement={isSmallScreen ? undefined : scroller}
        >
          {({ height, registerChild, onChildScroll, scrollTop }) => {
            if (!height) {
              return <div />;
            }

            return (
              <div ref={registerChild}>
                <Grid
                  ref={this.setGridRef}
                  className={styles.grid}
                  autoHeight={true}
                  height={height}
                  columnCount={columnCount}
                  columnWidth={columnWidth}
                  rowCount={rowCount}
                  rowHeight={rowHeight}
                  width={width}
                  onScroll={onChildScroll}
                  scrollTop={scrollTop}
                  overscanRowCount={2}
                  cellRenderer={this.cellRenderer}
                  scrollToAlignment={'start'}
                  isScrollingOptOut={true}
                />
              </div>
            );
          }
          }
        </WindowScroller>
      </Measure>
    );
  }
}

BookIndexPosters.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  sortKey: PropTypes.string,
  posterOptions: PropTypes.object.isRequired,
  jumpToCharacter: PropTypes.string,
  scrollTop: PropTypes.number.isRequired,
  scroller: PropTypes.instanceOf(Element).isRequired,
  showRelativeDates: PropTypes.bool.isRequired,
  shortDateFormat: PropTypes.string.isRequired,
  isSmallScreen: PropTypes.bool.isRequired,
  timeFormat: PropTypes.string.isRequired,
  selectedState: PropTypes.object.isRequired,
  onSelectedChange: PropTypes.func.isRequired,
  isEditorActive: PropTypes.bool.isRequired
};

export default BookIndexPosters;
