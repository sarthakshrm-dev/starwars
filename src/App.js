import React, { useEffect, useState } from "react";
import axios from "axios";
import "@fortawesome/fontawesome-free/css/all.css";
import "./App.css";

const sortOptions = [
  { value: "name", label: "Name" },
  { value: "species_name", label: "Species" },
  { value: "gender", label: "Gender" },
  { value: "birth_year", label: "Birth Year" },
  { value: "height", label: "Height" },
  { value: "mass", label: "Mass" },
  { value: "skin_color", label: "Skin Color" },
  { value: "eye_color", label: "Eye Color" },
  { value: "hair_color", label: "Hair Color" },
];

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [pagination, setPagination] = useState({
    pageCount: null,
    currentPage: null,
    prev: null,
    next: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [cardData, setCardData] = useState([]);

  useEffect(() => {
    setIsLoading(true);
    setError(false);

    axios
      .get("https://swapi.dev/api/people")
      .then((res) => {
        setPagination({
          pageCount: Math.ceil(res.data.count / 10),
          currentPage: 1,
          prev: res.data.previous,
          next: res.data.next,
        });
        dataCapturing(res);
      })
      .catch((err) => {
        console.error(err);
        setError(true);
        setIsLoading(false);
      });
  }, []);

  const handlePagination = (paginate) => {
    setIsLoading(true);
    setError(false);

    if (pagination[paginate] !== null) {
      axios
        .get(pagination[paginate])
        .then((res) => {
          dataCapturing(res);
        })
        .catch((err) => {
          console.error(err);
          setError(true);
          setIsLoading(false);
        });
    }
  };

  const handleSearch = (e) => {
    setSortBy("");
    setSearchTerm(e.target.value);
    if (e.target.value.length > 0) {
      setIsLoading(true);
      axios
        .get(`https://swapi.dev/api/people/?search=${e.target.value}`)
        .then((res) => {
          setPagination({
            pageCount: Math.ceil(res.data.count / 10),
            currentPage: 1,
            prev: res.data.previous,
            next: res.data.next,
          });

          dataCapturing(res);
        })
        .catch((err) => {
          console.error(err);
          setError(true);
          setIsLoading(false);
        });
    } else {
      setIsLoading(true);
      setError(false);

      axios
        .get("https://swapi.dev/api/people")
        .then((res) => {
          setPagination({
            pageCount: Math.ceil(res.data.count / 10),
            currentPage: 1,
            prev: res.data.previous,
            next: res.data.next,
          });

          dataCapturing(res);
        })
        .catch((err) => {
          console.error(err);
          setError(true);
          setIsLoading(false);
        });
    }
  };

  const handleSort = (value, label) => {
    const selectedSortBy = value;
    setSortBy(label);
    setIsOpen(false);

    if (selectedSortBy !== "") {
      const sortedData = [...data].sort((a, b) => {
        if (a[selectedSortBy] < b[selectedSortBy]) return -1;
        if (a[selectedSortBy] > b[selectedSortBy]) return 1;
        return 0;
      });

      setFilteredData(sortedData);
    }
  };

  const toggleDropdown = () => {
    setIsOpen((prevState) => !prevState);
  };

  const dataCapturing = (res) => {
    const details = res.data.results.map((x) => {
      const speciesPromise =
        x.species.length > 0
          ? axios.get(`${x.species[0]}`)
          : Promise.resolve({ data: { name: "Unknown" } });
      const filmsPromises = x.films.map((film) => axios.get(film));
      const starshipsPromises = x.starships.map((starship) =>
        axios.get(starship)
      );
      const vehiclesPromises = x.vehicles.map((vehicle) => axios.get(vehicle));

      return Promise.all([
        speciesPromise,
        ...filmsPromises,
        ...starshipsPromises,
        ...vehiclesPromises,
      ])
        .then((responses) => {
          const speciesRes = responses[0];
          const filmsRes = responses.slice(1, x.films.length + 1);
          const starshipsRes = responses.slice(
            x.films.length + 1,
            x.films.length + 1 + x.starships.length
          );
          const vehiclesRes = responses.slice(
            x.films.length + 1 + x.starships.length,
            x.films.length + 1 + x.starships.length + x.vehicles.length
          );

          const speciesData = speciesRes.data;
          const filmsData = filmsRes.map((filmRes) => filmRes.data.title);
          const starshipsData = starshipsRes.map(
            (starshipRes) => starshipRes.data.name
          );
          const vehiclesData = vehiclesRes.map(
            (vehicleRes) => vehicleRes.data.name
          );

          return {
            ...x,
            species_name: speciesData.name,
            films_names: filmsData,
            starships_names: starshipsData,
            vehicles_names: vehiclesData,
          };
        })
        .catch((err) => {
          console.log(err);
          return {
            ...x,
            species_name: "Unknown",
            films_names: [],
            starships_names: [],
            vehicles_names: [],
          };
        });
    });

    Promise.all(details).then((updatedData) => {
      getCharactersCount(updatedData);
      setData(updatedData);
      setFilteredData(updatedData);
      setIsLoading(false);
    });
  };

  const getCharactersCount = (data) => {
    var speciesCount = {};

    for (var i = 0; i < data.length; i++) {
      var character = data[i];
      var speciesName = character.species_name;

      if (!speciesCount[speciesName]) {
        speciesCount[speciesName] = 1;
      } else {
        speciesCount[speciesName]++;
      }
    }

    var speciesData = [];
    for (var species in speciesCount) {
      var data = {
        species: species,
        count: speciesCount[species],
      };
      speciesData.push(data);
    }

    setCardData(speciesData);
  };

  return (
    <div className="flex-container">
      <div className="card-container">
        {isLoading ? (
          <div className="card">
            <div className="loading-container">
              <i className="fa fa-spinner fa-spin"></i>
            </div>
          </div>
        ) : error ? (
          <div>
            <div className="error-container">
              <i className="fa fa-exclamation-circle"></i>
            </div>
          </div>
        ) : (
          <>
            <div className="card">
              <i className="fa fa-users"></i>
              <div className="card-info">
                <span className="count">{filteredData.length}</span>
                <span className="label">Total Characters</span>
              </div>
            </div>
            {cardData.map((x) => {
              return (
                <div className="card">
                  <i
                    className={
                      x.species === "Droid"
                        ? "fa fa-robot"
                        : x.species === "Human"
                        ? "fa fa-user"
                        : "fa fa-question"
                    }
                  ></i>
                  <div className="card-info">
                    <span className="count">{x.count}</span>
                    <span className="label">Total {x.species}</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
      <table>
        <thead>
          <tr>
            <th colSpan={12} className="table-options">
              <div className="dropdown">
                Sort By:
                <div className="dropdown-toggle" onClick={toggleDropdown}>
                  <span className="selected-sort">
                    {sortBy ? sortBy : "-- Select --"}
                  </span>
                  <i className={`fa fa-caret-${isOpen ? "up" : "down"}`}></i>
                </div>
                {isOpen && (
                  <div className="dropdown-menu">
                    {sortOptions.map((option) => (
                      <div
                        key={option.value}
                        className={`dropdown-item ${
                          sortBy === option.value ? "active" : ""
                        }`}
                        onClick={() => handleSort(option.value, option.label)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </th>
            <th colSpan={10} className="table-options">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search By Name..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </th>
          </tr>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Species</th>
            <th>Gender</th>
            <th>Birth Year</th>
            <th colSpan={3}>Films</th>
            <th colSpan={3}>Vehicles</th>
            <th colSpan={3}>Starships</th>
            <th>Height</th>
            <th>Mass</th>
            <th>Skin Color</th>
            <th>Eye Color</th>
            <th>Hair Color</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={22}>
                <div className="loading-container">
                  <i className="fa fa-spinner fa-spin"></i>
                </div>
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={22}>
                <div className="error-container">
                  <i className="fa fa-exclamation-circle"></i>
                  Error loading data. Please try again later.
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <div className="empty-container">
              <i className="fa fa-exclamation-triangle"></i>
              No results found.
            </div>
          ) : (
            filteredData.map((item) => (
              <tr key={item.id}>
                <td>
                  {" "}
                  {item.species_name === "Droid" && (
                    <i className="fa fa-robot"></i>
                  )}
                  {item.species_name === "Human" && (
                    <i className="fa fa-user"></i>
                  )}
                  {item.species_name !== "Droid" &&
                    item.species_name !== "Human" && (
                      <i className="fa fa-question"></i>
                    )}
                </td>
                <td>{item.name}</td>
                <td>{item.species_name}</td>
                <td>{item.gender}</td>
                <td>{item.birth_year}</td>
                {item.films_names.length > 0 ? (
                  <td colSpan={3}>
                    {item.films_names.map((x, index) => {
                      return (
                        <div>
                          {index !== item.films_names.length - 1 ? `${x},` : x}
                        </div>
                      );
                    })}
                  </td>
                ) : (
                  <td colSpan={3}>None</td>
                )}
                {item.vehicles_names.length > 0 ? (
                  <td colSpan={3}>
                    {item.vehicles_names.map((x, index) => {
                      return (
                        <div>
                          {index !== item.vehicles_names.length - 1
                            ? `${x},`
                            : x}
                        </div>
                      );
                    })}
                  </td>
                ) : (
                  <td colSpan={3}>None</td>
                )}
                {item.starships_names.length > 0 ? (
                  <td colSpan={3}>
                    {item.starships_names.map((x, index) => {
                      return (
                        <div>
                          {index !== item.starships_names.length - 1
                            ? `${x},`
                            : x}
                        </div>
                      );
                    })}
                  </td>
                ) : (
                  <td colSpan={3}>None</td>
                )}
                <td>{item.height} cm</td>
                <td>{item.mass} kg</td>
                <td>{item.skin_color}</td>
                <td>{item.eye_color}</td>
                <td>{item.hair_color}</td>
              </tr>
            ))
          )}
        </tbody>
        {!isLoading && !error && (
          <tfoot>
            <tr>
              <td colSpan={22}>
                <div className="pagination-container">
                  <button
                    className={`pagination-btn ${
                      pagination.prev ? "" : "disabled"
                    }`}
                    onClick={() => handlePagination("prev")}
                  >
                    <i className="fa fa-chevron-left"></i>
                  </button>
                  <span className="page-info">
                    {pagination.currentPage}/{pagination.pageCount}
                  </span>
                  <button
                    className={`pagination-btn ${
                      pagination.next ? "" : "disabled"
                    }`}
                    onClick={() => handlePagination("next")}
                  >
                    <i className="fa fa-chevron-right"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default App;
