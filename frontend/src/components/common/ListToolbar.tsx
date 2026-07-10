"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

type Props = {
  search: string;
  placeholder?: string;
  limit: number;
  onSearch: (value: string) => void;
  onLimitChange: (value: number) => void;
  onReset: () => void;
  actions?: ReactNode;
};

export default function ListToolbar({
  search,
  placeholder = "Search...",
  limit,
  onSearch,
  onLimitChange,
  onReset,
  actions,
}: Props) {
  const [value, setValue] = useState(search);

  useEffect(() => {
    setValue(search);
  }, [search]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(value);
  }

  function clear() {
    setValue("");
    onReset();
  }

  return (
    <div className="list-toolbar">
      <form className="list-search" onSubmit={submit}>
        <input
          aria-label="Search records"
          placeholder={placeholder}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />

        <button type="submit">Search</button>

        {search ? (
          <button className="secondary-button" type="button" onClick={clear}>
            Clear
          </button>
        ) : null}
      </form>

      <div className="list-toolbar-actions">
        <label className="page-size">
          Rows
          <select
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>

        {actions}
      </div>
    </div>
  );
}
