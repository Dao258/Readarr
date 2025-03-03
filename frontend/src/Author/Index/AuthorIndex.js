import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import RetagAuthorModal from 'Author/Editor/AudioTags/RetagAuthorModal';
import AuthorEditorFooter from 'Author/Editor/AuthorEditorFooter';
import OrganizeAuthorModal from 'Author/Editor/Organize/OrganizeAuthorModal';
import NoAuthor from 'Author/NoAuthor';
import LoadingIndicator from 'Components/Loading/LoadingIndicator';
import PageContent from 'Components/Page/PageContent';
import PageContentBody from 'Components/Page/PageContentBody';
import PageJumpBar from 'Components/Page/PageJumpBar';
import PageToolbar from 'Components/Page/Toolbar/PageToolbar';
import PageToolbarButton from 'Components/Page/Toolbar/PageToolbarButton';
import PageToolbarSection from 'Components/Page/Toolbar/PageToolbarSection';
import PageToolbarSeparator from 'Components/Page/Toolbar/PageToolbarSeparator';
import TableOptionsModalWrapper from 'Components/Table/TableOptions/TableOptionsModalWrapper';
import { align, icons, sortDirections } from 'Helpers/Props';
import getErrorMessage from 'Utilities/Object/getErrorMessage';
import hasDifferentItemsOrOrder from 'Utilities/Object/hasDifferentItemsOrOrder';
import translate from 'Utilities/String/translate';
import getSelectedIds from 'Utilities/Table/getSelectedIds';
import selectAll from 'Utilities/Table/selectAll';
import toggleSelected from 'Utilities/Table/toggleSelected';
import AuthorIndexFooterConnector from './AuthorIndexFooterConnector';
import AuthorIndexFilterMenu from './Menus/AuthorIndexFilterMenu';
import AuthorIndexSortMenu from './Menus/AuthorIndexSortMenu';
import AuthorIndexViewMenu from './Menus/AuthorIndexViewMenu';
import AuthorIndexOverviewsConnector from './Overview/AuthorIndexOverviewsConnector';
import AuthorIndexOverviewOptionsModal from './Overview/Options/AuthorIndexOverviewOptionsModal';
import AuthorIndexPostersConnector from './Posters/AuthorIndexPostersConnector';
import AuthorIndexPosterOptionsModal from './Posters/Options/AuthorIndexPosterOptionsModal';
import AuthorIndexTableConnector from './Table/AuthorIndexTableConnector';
import AuthorIndexTableOptionsConnector from './Table/AuthorIndexTableOptionsConnector';
import styles from './AuthorIndex.css';

function getViewComponent(view) {
  if (view === 'posters') {
    return AuthorIndexPostersConnector;
  }

  if (view === 'overview') {
    return AuthorIndexOverviewsConnector;
  }

  return AuthorIndexTableConnector;
}

class AuthorIndex extends Component {

  //
  // Lifecycle

  constructor(props, context) {
    super(props, context);

    this.state = {
      scroller: null,
      jumpBarItems: { order: [] },
      jumpToCharacter: null,
      isPosterOptionsModalOpen: false,
      isOverviewOptionsModalOpen: false,
      isEditorActive: false,
      isOrganizingAuthorModalOpen: false,
      isRetaggingAuthorModalOpen: false,
      allSelected: false,
      allUnselected: false,
      lastToggled: null,
      selectedState: {}
    };
  }

  componentDidMount() {
    this.setJumpBarItems();
    this.setSelectedState();
  }

  componentDidUpdate(prevProps) {
    const {
      items,
      sortKey,
      sortDirection
    } = this.props;

    if (sortKey !== prevProps.sortKey ||
        sortDirection !== prevProps.sortDirection ||
        hasDifferentItemsOrOrder(prevProps.items, items)
    ) {
      this.setJumpBarItems();
      this.setSelectedState();
    }

    if (this.state.jumpToCharacter != null) {
      this.setState({ jumpToCharacter: null });
    }
  }

  //
  // Control

  setScrollerRef = (ref) => {
    this.setState({ scroller: ref });
  }

  getSelectedIds = () => {
    if (this.state.allUnselected) {
      return [];
    }
    return getSelectedIds(this.state.selectedState);
  }

  setSelectedState() {
    const {
      items
    } = this.props;

    const {
      selectedState
    } = this.state;

    const newSelectedState = {};

    items.forEach((author) => {
      const isItemSelected = selectedState[author.id];

      if (isItemSelected) {
        newSelectedState[author.id] = isItemSelected;
      } else {
        newSelectedState[author.id] = false;
      }
    });

    const selectedCount = getSelectedIds(newSelectedState).length;
    const newStateCount = Object.keys(newSelectedState).length;
    let isAllSelected = false;
    let isAllUnselected = false;

    if (selectedCount === 0) {
      isAllUnselected = true;
    } else if (selectedCount === newStateCount) {
      isAllSelected = true;
    }

    this.setState({ selectedState: newSelectedState, allSelected: isAllSelected, allUnselected: isAllUnselected });
  }

  setJumpBarItems() {
    const {
      items,
      sortKey,
      sortDirection
    } = this.props;

    // Reset if not sorting by sortName
    if (sortKey !== 'sortName' && sortKey !== 'sortNameLastFirst') {
      this.setState({ jumpBarItems: { order: [] } });
      return;
    }

    const characters = _.reduce(items, (acc, item) => {
      let char = item[sortKey].charAt(0);

      if (!isNaN(char)) {
        char = '#';
      }

      if (char in acc) {
        acc[char] = acc[char] + 1;
      } else {
        acc[char] = 1;
      }

      return acc;
    }, {});

    const order = Object.keys(characters).sort();

    // Reverse if sorting descending
    if (sortDirection === sortDirections.DESCENDING) {
      order.reverse();
    }

    const jumpBarItems = {
      characters,
      order
    };

    this.setState({ jumpBarItems });
  }

  //
  // Listeners

  onPosterOptionsPress = () => {
    this.setState({ isPosterOptionsModalOpen: true });
  }

  onPosterOptionsModalClose = () => {
    this.setState({ isPosterOptionsModalOpen: false });
  }

  onOverviewOptionsPress = () => {
    this.setState({ isOverviewOptionsModalOpen: true });
  }

  onOverviewOptionsModalClose = () => {
    this.setState({ isOverviewOptionsModalOpen: false });
  }

  onEditorTogglePress = () => {
    if (this.state.isEditorActive) {
      this.setState({ isEditorActive: false });
    } else {
      const newState = selectAll(this.state.selectedState, false);
      newState.isEditorActive = true;
      this.setState(newState);
    }
  }

  onJumpBarItemPress = (jumpToCharacter) => {
    this.setState({ jumpToCharacter });
  }

  onSelectAllChange = ({ value }) => {
    this.setState(selectAll(this.state.selectedState, value));
  }

  onSelectAllPress = () => {
    this.onSelectAllChange({ value: !this.state.allSelected });
  }

  onSelectedChange = ({ id, value, shiftKey = false }) => {
    this.setState((state) => {
      return toggleSelected(state, this.props.items, id, value, shiftKey);
    });
  }

  onSaveSelected = (changes) => {
    this.props.onSaveSelected({
      authorIds: this.getSelectedIds(),
      ...changes
    });
  }

  onOrganizeAuthorPress = () => {
    this.setState({ isOrganizingAuthorModalOpen: true });
  }

  onOrganizeAuthorModalClose = (organized) => {
    this.setState({ isOrganizingAuthorModalOpen: false });

    if (organized === true) {
      this.onSelectAllChange({ value: false });
    }
  }

  onRetagAuthorPress = () => {
    this.setState({ isRetaggingAuthorModalOpen: true });
  }

  onRetagAuthorModalClose = (organized) => {
    this.setState({ isRetaggingAuthorModalOpen: false });

    if (organized === true) {
      this.onSelectAllChange({ value: false });
    }
  }

  onRefreshAuthorPress = () => {
    const selectedIds = this.getSelectedIds();
    const refreshIds = this.state.isEditorActive && selectedIds.length > 0 ? selectedIds : [];

    this.props.onRefreshAuthorPress(refreshIds);
  }

  //
  // Render

  render() {
    const {
      isFetching,
      isPopulated,
      error,
      totalItems,
      items,
      columns,
      selectedFilterKey,
      filters,
      customFilters,
      sortKey,
      sortDirection,
      view,
      isRefreshingAuthor,
      isRssSyncExecuting,
      isOrganizingAuthor,
      isRetaggingAuthor,
      isSaving,
      saveError,
      isDeleting,
      deleteError,
      onScroll,
      onSortSelect,
      onFilterSelect,
      onViewSelect,
      onRssSyncPress,
      ...otherProps
    } = this.props;

    const {
      scroller,
      jumpBarItems,
      jumpToCharacter,
      isPosterOptionsModalOpen,
      isOverviewOptionsModalOpen,
      isEditorActive,
      selectedState,
      allSelected,
      allUnselected
    } = this.state;

    const selectedAuthorIds = this.getSelectedIds();

    const ViewComponent = getViewComponent(view);
    const isLoaded = !!(!error && isPopulated && items.length && scroller);
    const hasNoAuthor = !totalItems;

    const refreshLabel = isEditorActive && selectedAuthorIds.length > 0 ? translate('UpdateSelected') : translate('UpdateAll');

    return (
      <PageContent>
        <PageToolbar>
          <PageToolbarSection>
            <PageToolbarButton
              label={refreshLabel}
              iconName={icons.REFRESH}
              spinningName={icons.REFRESH}
              isSpinning={isRefreshingAuthor}
              onPress={this.onRefreshAuthorPress}
            />

            <PageToolbarButton
              label={translate('RSSSync')}
              iconName={icons.RSS}
              isSpinning={isRssSyncExecuting}
              isDisabled={hasNoAuthor}
              onPress={onRssSyncPress}
            />

            <PageToolbarSeparator />

            {
              isEditorActive ?
                <PageToolbarButton
                  label={translate('AuthorIndex')}
                  iconName={icons.AUTHOR_CONTINUING}
                  isDisabled={hasNoAuthor}
                  onPress={this.onEditorTogglePress}
                /> :
                <PageToolbarButton
                  label={translate('AuthorEditor')}
                  iconName={icons.EDIT}
                  isDisabled={hasNoAuthor}
                  onPress={this.onEditorTogglePress}
                />
            }

            {
              isEditorActive ?
                <PageToolbarButton
                  label={allSelected ? translate('UnselectAll') : translate('SelectAll')}
                  iconName={icons.CHECK_SQUARE}
                  isDisabled={hasNoAuthor}
                  onPress={this.onSelectAllPress}
                /> :
                null
            }

          </PageToolbarSection>

          <PageToolbarSection
            alignContent={align.RIGHT}
            collapseButtons={false}
          >
            {
              view === 'table' ?
                <TableOptionsModalWrapper
                  {...otherProps}
                  columns={columns}
                  optionsComponent={AuthorIndexTableOptionsConnector}
                >
                  <PageToolbarButton
                    label={translate('Options')}
                    iconName={icons.TABLE}
                  />
                </TableOptionsModalWrapper> :
                null
            }

            {
              view === 'posters' ?
                <PageToolbarButton
                  label={translate('Options')}
                  iconName={icons.POSTER}
                  isDisabled={hasNoAuthor}
                  onPress={this.onPosterOptionsPress}
                /> :
                null
            }

            {
              view === 'overview' ?
                <PageToolbarButton
                  label={translate('Options')}
                  iconName={icons.OVERVIEW}
                  isDisabled={hasNoAuthor}
                  onPress={this.onOverviewOptionsPress}
                /> :
                null
            }

            <PageToolbarSeparator />

            <AuthorIndexViewMenu
              view={view}
              isDisabled={hasNoAuthor}
              onViewSelect={onViewSelect}
            />

            <AuthorIndexSortMenu
              sortKey={sortKey}
              sortDirection={sortDirection}
              isDisabled={hasNoAuthor}
              onSortSelect={onSortSelect}
            />

            <AuthorIndexFilterMenu
              selectedFilterKey={selectedFilterKey}
              filters={filters}
              customFilters={customFilters}
              isDisabled={hasNoAuthor}
              onFilterSelect={onFilterSelect}
            />
          </PageToolbarSection>
        </PageToolbar>

        <div className={styles.pageContentBodyWrapper}>
          <PageContentBody
            registerScroller={this.setScrollerRef}
            className={styles.contentBody}
            innerClassName={styles[`${view}InnerContentBody`]}
            onScroll={onScroll}
          >
            {
              isFetching && !isPopulated &&
                <LoadingIndicator />
            }

            {
              !isFetching && !!error &&
                <div className={styles.errorMessage}>
                  {getErrorMessage(error, 'Failed to load author from API')}
                </div>
            }

            {
              isLoaded &&
                <div className={styles.contentBodyContainer}>
                  <ViewComponent
                    scroller={scroller}
                    items={items}
                    filters={filters}
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                    jumpToCharacter={jumpToCharacter}
                    isEditorActive={isEditorActive}
                    allSelected={allSelected}
                    allUnselected={allUnselected}
                    onSelectedChange={this.onSelectedChange}
                    onSelectAllChange={this.onSelectAllChange}
                    selectedState={selectedState}
                    {...otherProps}
                  />

                  <AuthorIndexFooterConnector />
                </div>
            }

            {
              !error && isPopulated && !items.length &&
                <NoAuthor totalItems={totalItems} />
            }
          </PageContentBody>

          {
            isLoaded && !!jumpBarItems.order.length &&
              <PageJumpBar
                items={jumpBarItems}
                onItemPress={this.onJumpBarItemPress}
              />
          }
        </div>

        {
          isLoaded && isEditorActive &&
            <AuthorEditorFooter
              authorIds={selectedAuthorIds}
              selectedCount={selectedAuthorIds.length}
              isSaving={isSaving}
              saveError={saveError}
              isDeleting={isDeleting}
              deleteError={deleteError}
              isOrganizingAuthor={isOrganizingAuthor}
              isRetaggingAuthor={isRetaggingAuthor}
              showMetadataProfile={true}
              onSaveSelected={this.onSaveSelected}
              onOrganizeAuthorPress={this.onOrganizeAuthorPress}
              onRetagAuthorPress={this.onRetagAuthorPress}
            />
        }

        <AuthorIndexPosterOptionsModal
          isOpen={isPosterOptionsModalOpen}
          onModalClose={this.onPosterOptionsModalClose}
        />

        <AuthorIndexOverviewOptionsModal
          isOpen={isOverviewOptionsModalOpen}
          onModalClose={this.onOverviewOptionsModalClose}
        />

        <OrganizeAuthorModal
          isOpen={this.state.isOrganizingAuthorModalOpen}
          authorIds={selectedAuthorIds}
          onModalClose={this.onOrganizeAuthorModalClose}
        />

        <RetagAuthorModal
          isOpen={this.state.isRetaggingAuthorModalOpen}
          authorIds={selectedAuthorIds}
          onModalClose={this.onRetagAuthorModalClose}
        />

      </PageContent>
    );
  }
}

AuthorIndex.propTypes = {
  isFetching: PropTypes.bool.isRequired,
  isPopulated: PropTypes.bool.isRequired,
  error: PropTypes.object,
  totalItems: PropTypes.number.isRequired,
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedFilterKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  filters: PropTypes.arrayOf(PropTypes.object).isRequired,
  customFilters: PropTypes.arrayOf(PropTypes.object).isRequired,
  sortKey: PropTypes.string,
  sortDirection: PropTypes.oneOf(sortDirections.all),
  view: PropTypes.string.isRequired,
  isRefreshingAuthor: PropTypes.bool.isRequired,
  isOrganizingAuthor: PropTypes.bool.isRequired,
  isRetaggingAuthor: PropTypes.bool.isRequired,
  isRssSyncExecuting: PropTypes.bool.isRequired,
  isSmallScreen: PropTypes.bool.isRequired,
  isSaving: PropTypes.bool.isRequired,
  saveError: PropTypes.object,
  isDeleting: PropTypes.bool.isRequired,
  deleteError: PropTypes.object,
  onSortSelect: PropTypes.func.isRequired,
  onFilterSelect: PropTypes.func.isRequired,
  onViewSelect: PropTypes.func.isRequired,
  onRefreshAuthorPress: PropTypes.func.isRequired,
  onRssSyncPress: PropTypes.func.isRequired,
  onScroll: PropTypes.func.isRequired,
  onSaveSelected: PropTypes.func.isRequired
};

export default AuthorIndex;
