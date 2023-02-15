import './style.scss';
import React from 'react';
import ReactPaginate from 'react-paginate';


function Pagination (props) {
    const {
        total,
        pageSize,
        current,
        onChange,
    } = props;


    const items = Array.from(Array(total).keys());
    const pageCount = Math.ceil(items.length / pageSize);

    const handlePageClick = (event) => onChange && onChange(event.selected + 1);

    return (
        <ReactPaginate
            initialPage={current - 1}
            breakLabel="..."
            onPageChange={handlePageClick}
            pageRangeDisplayed={5}
            pageCount={pageCount}
            marginPagesDisplayed={2}
            nextLabel='►'
            previousLabel='◄'
            renderOnZeroPageCount={false}
            containerClassName={'pagination'} /* as this work same as bootstrap class */
            subContainerClassName={'pages pagination'} /* as this work same as bootstrap class */
            activeClassName={'active'} /* as this work same as bootstrap class */
        />
    );
}

export default Pagination;
